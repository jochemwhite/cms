"use client";

import { createClient } from "@/lib/supabase/supabaseClient"; // Your Supabase client instance
import { UserSession } from "@/types/custom-supabase-types"; // Your custom session type (make sure it matches get_user_session RPC output)
import { Database } from "@/types/supabase"; // Your Supabase generated types
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";

interface UserSessionContextValue {
  userSession: UserSession | null;
  loadingSession: boolean;
  sessionError: any;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

interface UserSessionProviderProps {
  children: ReactNode;
  userData: UserSession | null; // `userData` can now be null if no session on server
}

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData }) => {
  // Initialize state directly from userData prop, assuming it's pre-fetched from a server component
  const [userSession, setUserSession] = useState<UserSession | null>(userData);
  const [loadingSession, setLoadingSession] = useState<boolean>(!userData); // Set true if no initial userData
  const [sessionError, setSessionError] = useState<any>(null);
  const supabase = createClient();

  // Helper function to call the 'get_user_session' RPC and update state
  const getSupabaseUserSession = useCallback(async (): Promise<UserSession | null> => {
    setLoadingSession(true);
    setSessionError(null); // Clear previous errors
    try {
      const { data, error } = await supabase.rpc("get_user_session");
      if (error) {
        console.error("Error fetching user session from RPC:", error);
        setSessionError(error);
        return null;
      }
      return data as UserSession;
    } catch (error) {
      console.error("Unexpected error during RPC call:", error);
      setSessionError(error);
      return null;
    } finally {
      setLoadingSession(false);
    }
  }, [supabase]); // Dependency on supabase client instance

  // Realtime handler for global role changes
  const handleRoleChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["user_global_roles"]["Row"]>) => {
      // Get the current authenticated user's ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      // The payload contains the user_id of the row that changed
      const changedUserId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;

      // Only re-fetch if the change is relevant to the current user's global roles
      if (currentUserId && changedUserId === currentUserId) {
        // Re-fetch the complete session from the server using the RPC
        const updatedSession = await getSupabaseUserSession();
        setUserSession(updatedSession);
      } else {
      }
    },
    [getSupabaseUserSession, setUserSession, supabase]
  ); // Dependencies for useCallback

  // Subscribe to auth state changes and Realtime updates
  useEffect(() => {
    // 1. Auth state changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === "SIGNED_IN" && session) {
        // When signed in, fetch the full session data using your RPC
        const sessionData = await getSupabaseUserSession();
        setUserSession(sessionData);
      } else if (_event === "SIGNED_OUT") {
        setUserSession(null);
        // If you always want to redirect on sign out, uncomment this:
        redirect("/");
      }
    });

    // 2. Realtime subscription for user_global_roles
    // Only subscribe if a user is potentially logged in (i.e., userSession isn't null on mount)
    // The filter will ensure we only get relevant updates.
    const currentUserId = userSession?.user_info?.id;
    let rolesChannel: ReturnType<typeof supabase.channel> | null = null;

    if (currentUserId) {
      rolesChannel = supabase.channel(`user_global_roles_channel_${currentUserId}`).on(
        "postgres_changes",
        {
          event: "*", // Listen for INSERT, UPDATE, DELETE
          schema: "public",
          table: "user_global_roles",
          filter: `user_id=eq.${currentUserId}`, // Crucial: only get changes for THIS user
        },
        handleRoleChange
      );

      rolesChannel.subscribe();
    } else return;
    return () => {
      authSubscription.unsubscribe();
      if (rolesChannel) {
        rolesChannel.unsubscribe();
      }
    };
  }, [supabase, userSession?.user_info?.id, getSupabaseUserSession, handleRoleChange]); // Add dependencies

  // Redirect if no user session is available (e.g., after sign-out or initial load)
  // Ensure this is handled gracefully if there's a login page.
  if (!userSession && !loadingSession && !sessionError) {
    redirect("/");
  }

  const value: UserSessionContextValue = {
    userSession,
    loadingSession,
    sessionError,
  };

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
};

export const useUserSession = (): UserSessionContextValue => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserSessionProvider");
  }
  return context;
};
