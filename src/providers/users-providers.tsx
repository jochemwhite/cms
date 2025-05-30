"use client";

import { DeleteUser, ResendOnboardingEmail, SendPasswordResetEmail } from "@/actions/authentication/user-management";
import { AvailableRole, UserForProvider } from "@/types/custom-supabase-types";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface UsersContextType {
  users: UserForProvider[];
  setUsers: (users: UserForProvider[]) => void;
  loading: boolean;
  error: string | null;
  addUser: (user: Omit<UserForProvider, "id">) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserForProvider>) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => UserForProvider | undefined;
  availableRoles: AvailableRole[];
  handleSendPasswordResetEmail: (email: string) => Promise<void>;
  handleResendOnboardingEmail: (userId: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface userProviderProps {
  children: ReactNode;
  initialUsers: UserForProvider[];
  initialAvailableRoles: AvailableRole[];
}

export function UsersProvider({ children, initialUsers, initialAvailableRoles }: userProviderProps) {
  const [users, setUsers] = useState<UserForProvider[]>(initialUsers);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>(initialAvailableRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
    setAvailableRoles(initialAvailableRoles);
  }, [initialUsers, initialAvailableRoles]);

  const addUser = useCallback(async (user: Omit<UserForProvider, "id">) => {
    try {
      setLoading(true);
      // Here you would typically make an API call to create the user
      // For now, we'll simulate it with a local update
      const newUser = {
        ...user,
        id: crypto.randomUUID(),
      };
      setUsers((prev) => [...prev, newUser]);
      toast.success("User added successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user");
      toast.error("Failed to add user");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<UserForProvider>) => {
    try {
      setLoading(true);
      // Here you would typically make an API call to update the user
      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...updates } : user)));
      toast.success("User updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteUser = async (userId: string) => {
    toast.promise(
      async () => {
        const { data, error, success } = await DeleteUser(userId);
        if (!success) {
          throw error || "Failed to delete user";
        }
        return data;
      },
      {
        loading: "Deleting user...",
        success: "User deleted successfully",
        error: (error) => {
          return error;
        },
      }
    );
  };

  const handleSendPasswordResetEmail = async (email: string) => {
    toast.promise(
      async () => {
        const { success, error } = await SendPasswordResetEmail(email);
        if (!success) {
          throw error || "Failed to send password reset email";
        }
        return true;
      },
      {
        loading: "Sending password reset email...",
        success: "Password reset email sent successfully",
        error: (error) => {
          return error;
        },
      }
    );
  };

  const handleResendOnboardingEmail = async (userId: string) => {

    toast.promise(
      async () => {
        const { success, error } = await ResendOnboardingEmail(userId);
        if (!success) {
          throw error || "Failed to resend onboarding email";
        }
        return true;
      },
      {
        loading: "Resending onboarding email...",
        success: "Onboarding email resent successfully",
        error: (error) => {
          return error;
        },
      }
    );
  };

  const getUserById = useCallback(
    (id: string) => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  const value = {
    users,
    setUsers,
    loading,
    error,
    addUser,
    updateUser,
    handleDeleteUser,
    getUserById,
    availableRoles,
    handleSendPasswordResetEmail,
    handleResendOnboardingEmail,
    };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
}
