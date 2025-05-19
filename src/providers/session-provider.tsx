"use client";
import { createClient } from "@/lib/supabase/supabaseClient"; // Assuming you have your Supabase client setup here
import { UserSession } from "@/types/custom-supabase-types";
import { Database } from "@/types/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserSessionContextValue {
  userSession: UserSession | null;
  loadingSession: boolean;
  sessionError: any;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

interface UserSessionProviderProps {
  children: ReactNode;
  userData: UserSession;
}

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData }) => {
  const [userSession, setUserSession] = useState<UserSession | null>({
    global_roles: userData.global_roles,
    user_info: userData.user_info,
    available_tenants: userData.available_tenants,
  });
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<any>(null);
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
            global_roles: userData.global_roles,
            user_info: userData.user_info,
            available_tenants: userData.available_tenants,
          });
          break;
        case "SIGNED_OUT":
          setUserSession(null);
          break;
        default:
          break;
      }
    });

    const newRoles = supabase.channel("cms_user_roles").on(
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
  }, [supabase, userSession]);

  const handleRoleChange = (event: any) => {
    const payload = event as RealtimePostgresChangesPayload<Database["public"]["Tables"]["cms_user_roles"]["Row"]>;

    let newRoles = userSession?.global_roles || [];
    switch (payload.eventType) {
      case "INSERT":
        if (payload.new && "id" in payload.new) {
          newRoles.push({ id: payload.new.id, role: payload.new.role, user_id: payload.new.user_id });
        }
        break;
      case "UPDATE":
        console.log("Payload", payload);

        if (payload.new && "id" in payload.new && "role" in payload.new) {
          const newRole = { id: payload.new.id, role: payload.new.role, user_id: payload.new.user_id };

          newRoles = newRoles.map((role) => (role.id === newRole.id ? newRole : role));
        }
        break;
      case "DELETE":
        newRoles = newRoles.filter((role) => role.id !== (payload.old && "id" in payload.old ? payload.old.id : ""));
        break;
      default:
        break;
    }

    if (newRoles.length > 0 && userSession) {
      setUserSession({
        global_roles: newRoles,
        user_info: userSession.user_info,
        available_tenants: userSession.available_tenants,
      });
    }
  };

  if (!userSession) return redirect("/");

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
