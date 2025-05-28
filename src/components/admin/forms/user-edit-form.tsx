"use client";
import React, { use, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useUserForm } from "react-hook-form";
import { UserSchema, type UserFormValues } from "@/schemas/user-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createUserInvite } from "@/actions/authentication/invites";
import { AvailableRole } from "@/types/custom-supabase-types";
import { createClient } from "@/lib/supabase/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface UserCreationFormProps {
  onSuccess: (user: any) => void;
  initialData: UserFormValues;
}

export const UserCreationForm: React.FC<UserCreationFormProps> = ({ onSuccess, initialData }) => {
  const supabase = createClient();
  const form = useUserForm<UserFormValues>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      send_invite: initialData?.send_invite || true,
      global_role: initialData?.global_role || "3589969a-81b2-461a-a94e-e76a1fcd7961",
    },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [roles, setRoles] = React.useState<AvailableRole[]>([]);

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await createUserInvite(data);
      if (response.success) {
        onSuccess(response.data);
      } else {
        setError(response.error ?? "Unknown error occurred");
      }
    } catch (e) {
      setError("Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // fetch roles from supabase
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("global_role_types").select("*");
      if (error) {
        toast.error("Failed to fetch roles");
      } else {
        setRoles(data);
      }
      setLoading(false);
    };
    fetchRoles();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="global_role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin" />
                      </div>
                    ) : (
                      <SelectValue placeholder="Select a role" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="send_invite"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Send Invite</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create User"}
        </Button>
      </form>
    </Form>
  );
};

export default UserCreationForm;
