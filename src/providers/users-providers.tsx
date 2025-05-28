"use client";

import { UserEntry } from "@/components/admin/tables/user-table/columns";
import { AvailableRole, UserForProvider } from "@/types/custom-supabase-types";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { toast } from "sonner";

interface UsersContextType {
  users: UserForProvider[];
  setUsers: (users: UserForProvider[]) => void;
  loading: boolean;
  error: string | null;
  addUser: (user: Omit<UserForProvider, "id">) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserForProvider>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => UserForProvider | undefined;
  availableRoles: AvailableRole[];
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
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
      );
      toast.success("User updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      // Here you would typically make an API call to delete the user
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("User deleted successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  }, []);

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
    deleteUser,
    getUserById,
    availableRoles,
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
