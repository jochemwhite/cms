"use client";

import { DeleteUser } from "@/actions/authentication/user-management";
import { createClient } from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { Database } from "@/types/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface UserSessionContextValue {
  userSession: UserSession | null;
  loadingSession: boolean;
  sessionError: any;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

interface UserSessionProviderProps {
  children: ReactNode;
  userData: UserSession | null;
}

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData }) => {
  const [userSession, setUserSession] = useState<UserSession | null>(userData);
  const [loadingSession, setLoadingSession] = useState<boolean>(!userData);
  const [sessionError, setSessionError] = useState<any>(null);
  const supabase = createClient();

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
  }, [supabase]);

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
  );





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
  }, [supabase, userSession?.user_info?.id, getSupabaseUserSession, handleRoleChange]);

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
