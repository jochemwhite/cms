"use client";

import AuthMFA from "@/components/auth/auth-mfa";
import { Spinner } from "@/components/ui/spinner";
import supabase from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { Database } from "@/types/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

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
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<any>(null);
  const [showMFAScreen, setShowMFAScreen] = useState(false);
  const router = useRouter();


  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) {
          throw error;
        }
        if (data.nextLevel === "aal2" && data.nextLevel !== data.currentLevel) {
          setShowMFAScreen(true);
        }
      } catch (error) {
        console.error(error);
      }
      setLoadingSession(false);
    })();
  }, [userSession]);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      const changedUserId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;

      if (currentUserId && changedUserId === currentUserId) {
        const updatedSession = await getSupabaseUserSession();
        setUserSession(updatedSession);
      } else {
      }
    },
    [getSupabaseUserSession, setUserSession, supabase]
  );

  useEffect(() => {
    if (userData) {
      setUserSession(userData);
    }
  }, [userData]);

  useEffect(() => {
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === "SIGNED_IN" && session) {
        const sessionData = await getSupabaseUserSession();
        setUserSession(sessionData);
      } else if (_event === "SIGNED_OUT") {
        setUserSession(null);
        router.push("/");
      }
    });

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
    router.push("/");
  }

  const value: UserSessionContextValue = {
    userSession,
    loadingSession,
    sessionError,
  };

  return (
    <UserSessionContext.Provider value={value}>
      {loadingSession ? (
        <div className="flex justify-center items-center h-screen">
          <Spinner size={100} />
        </div>
      ) : showMFAScreen ? (
        <div className="flex justify-center items-center h-screen">
          <AuthMFA onSuccess={() => setShowMFAScreen(false)} />
        </div>
      ) : (
        children
      )}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = (): UserSessionContextValue => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserSessionProvider");
  }
  return context;
};
