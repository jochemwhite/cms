"use client";
import { createClient } from "@/lib/supabase/supabaseClient"; // Assuming you have your Supabase client setup here
import { Database } from "@/types/supabase";
import { RealtimeChannel, RealtimeMessage, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserSessionData {
  user_info: Database["public"]["Tables"]["users"]["Row"];
  cms_roles: Database["public"]["Functions"]["get_user_session"]["Returns"][0]["cms_roles"] | null
  tenant_roles: Database["public"]["Functions"]["get_user_session"]["Returns"][0]["tenant_roles"];
}

interface UserSessionContextValue {
  userSession: UserSessionData; // Can be null if session is not loaded or an error occurred
  loadingSession: boolean;
  sessionError: any; // Or more specific error type if you have one
  // Add functions to refresh session here if needed, e.g., refreshSession: () => void;
}

// 2. Create a Context with the Context Value Type
const UserSessionContext = createContext<UserSessionContextValue | null>(null); // Explicitly type the context

// 3. Create a Provider Component with TypeScript types
interface UserSessionProviderProps {
  children: ReactNode; // Type the children prop
  userData: Database["public"]["Functions"]["get_user_session"]["Returns"][0]; // Type the userData prop
}

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData }) => {
  const [userSession, setUserSession] = useState<UserSessionData | null>({
    cms_roles: userData.cms_roles,
    tenant_roles: userData.tenant_roles,
    user_info: userData.user_info as Database["public"]["Tables"]["users"]["Row"],
  }); // Type userSession state
  const [loadingSession, setLoadingSession] = useState<boolean>(true); // Type loadingSession state
  const [sessionError, setSessionError] = useState<any>(null); // Type sessionError state
  const supabase = createClient();

  useEffect(() => {
    if (!userData) {
      setLoadingSession(false);
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      switch (_event) {
        case "SIGNED_IN":
          setUserSession({
            cms_roles: userData.cms_roles,
            tenant_roles: userData.tenant_roles,
            user_info: userData.user_info as Database["public"]["Tables"]["users"]["Row"],
          });
          break;
        case "SIGNED_OUT":
          setUserSession(null);
          break;
        default:
          break;
      }
    });

    const newRoles = supabase.channel("roles").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cms_user_roles",
      },
      handleRoleChange
    );

    newRoles.subscribe();

    return () => {
      subscription.unsubscribe();
      newRoles.unsubscribe();
    };
  }, []);

  const handleRoleChange = (event: any) => {
    const payload = event as RealtimePostgresChangesPayload<Database["public"]["Tables"]["cms_user_roles"]["Row"]>;


    let newRoles = userSession?.cms_roles || [];
    switch (payload.eventType) {
      case "INSERT":
        if (payload.new && "id" in payload.new) {
          newRoles.push({ id: payload.new.id, role: payload.new.role });
        }
        break;
      case "UPDATE":
          console.log("Payload", payload);

        if (payload.new && "id" in payload.new && "role" in payload.new) {
          const newRole = { id: payload.new.id, role: payload.new.role };


          newRoles = newRoles.map((role) => (role.id === newRole.id ? newRole : role));
        }
        break;
      case "DELETE":
        newRoles = newRoles.filter((role) => role.id !== (payload.old && 'id' in payload.old ? payload.old.id : ''));
        break;
      default:
        break;
  }
  
  if(newRoles.length > 0 && userSession){

    setUserSession({
      cms_roles: newRoles,
      tenant_roles: userSession.tenant_roles,
      user_info: userSession.user_info
    });
  }
  
  
  
}

if (!userSession) return redirect("/");

  const value: UserSessionContextValue = {
    // Type the value object
    userSession,
    loadingSession,
    sessionError,
    // refreshSession: () => { /* ... refresh logic ... */ } // Example if you add refresh function
  };

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
};

// 4. Create a custom hook to consume the context with TypeScript type
export const useUserSession = (): UserSessionContextValue => {
  // Type the return value of the hook
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserSessionProvider");
  }

  return context;
};
