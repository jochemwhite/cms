// "use server"; // Add if not already present in the file

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { UsersProvider } from "@/providers/users-providers";
import { checkRequiredRoles } from "@/server/auth/check-required-roles"; // Import the auth checker
import { AvailableRole, UserForProvider } from "@/types/custom-supabase-types";
import { redirect } from "next/navigation"; // For redirection if unauthorized

// Raw data structure directly from Supabase SDK's select
interface UserRawData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_sign_in_at: string | null; // This assumes it's a column on public.users, or it will be null
  avatar: string | null;
  // This property name comes from the foreign key relationship in your Supabase schema
  user_global_roles: Array<{
    id: string; // This is the actual ID of the assignment in user_global_roles
    // This property name comes from the foreign key relationship in your Supabase schema
    global_role_types: {
      id: string; // This is the actual ID of the global_role_types entry
      role_name: string;
      description: string;
    } | null; // Can be null if role type is somehow missing (e.g., deleted)
  }>;
}

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser || !currentUser.user?.id) {
    return redirect("/auth/login");
  }

  const isSystemAdmin = await checkRequiredRoles(currentUser.user?.id, ["system_admin"]);
  if (!isSystemAdmin) {
    return redirect("/dashboard"); // Adjust as needed
  }

  const defaultPageSize = 20;
  const defaultOffset = 0; // For the first page

  const {
    data: usersRaw,
    count: totalUsersCount,
    error: usersError,
  } = await supabase
    .from("users")
    .select<string, UserRawData>(
      `
      id,
      email,
      first_name,
      last_name,
      created_at,      
      avatar,
      user_global_roles (
        id, 
        global_role_types (
          id,
          role_name,
          description 
        )
      )
    `,
      { count: "exact" }
    ) // Request total count for pagination
    .order("email", { ascending: true }) // Essential for consistent pagination
    .order("id", { ascending: true }) // Secondary sort for stability
    .range(defaultOffset, defaultOffset + defaultPageSize - 1); // Fetch first page

  if (usersError) {
    console.error("Error fetching users:", usersError);
    // Handle error, e.g., display a message or redirect
    return <div>Error loading users: {usersError.message}</div>;
  }

  // 3. Transform Raw User Data to Desired Format
  const usersWithRoles: UserForProvider[] = (usersRaw || []).map((user) => {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      avatar: user.avatar,
      roles: user.user_global_roles.map((assignment) => ({
        assignment_id: assignment.id,
        role_type_id: assignment.global_role_types?.id || "", // Handle potential null if role_type is missing
        role_name: assignment.global_role_types?.role_name || "Unknown",
        role_description: assignment.global_role_types?.description || "",
      })),
    };
  });

  // 4. Fetch Available Roles (from global_role_types table)
  const { data: availableRolesData, error: rolesError } = await supabase.from("global_role_types").select(`
      id,
      role_name,
      description
    `);

  if (rolesError) {
    console.error("Error fetching available roles:", rolesError);

    return <div>Error loading available roles: {rolesError.message}</div>;
  }

  const availableRoles: AvailableRole[] = availableRolesData || [];

  // 5. Pass data to the UsersProvider
  // You might want to pass totalUsersCount as well if your provider uses it
  return (
    <UsersProvider
      initialUsers={usersWithRoles}
      initialAvailableRoles={availableRoles}
      // initialTotalUsersCount={totalUsersCount || 0} // Optional: Pass total count
    >
      {children}
    </UsersProvider>
  );
}
