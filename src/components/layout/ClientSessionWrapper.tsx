"use client";

import { UserSessionProvider } from "@/providers/session-provider";
import { UserSession } from "@/types/custom-supabase-types";
import React from "react";

interface ClientSessionWrapperProps {
  children: React.ReactNode;
  userData: UserSession | null;
}

export const ClientSessionWrapper: React.FC<ClientSessionWrapperProps> = ({ 
  children, 
  userData 
}) => {
  return (
    <UserSessionProvider userData={userData}>
      {children}
    </UserSessionProvider>
  );
};