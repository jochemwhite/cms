"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { createClient } from "@/lib/supabase/supabaseClient";
import { useUserSession } from "@/providers/session-provider";
import { updateUserPassword } from "@/actions/authentication/user-settings";
// Import your Supabase client instance (adjust the import path as needed)

interface PasswordSectionProps {
  staggerIndex?: number;
}

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
        message: "Password must include uppercase, lowercase, and numbers",
      }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const PasswordSection: React.FC<PasswordSectionProps> = ({ staggerIndex = 0 }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { userSession } = useUserSession();
  const supabase = createClient();
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);

    toast.promise(
      async () => {
        const { success, error } = await updateUserPassword(values.currentPassword, values.newPassword);
        if (!success) {
          throw error || "Failed to update password";
        }
        return true;
      },
      { 
        loading: "Updating password...",
        success: "Password updated successfully",
        error: (error) => {
          return error;
        },
        finally() {
          setIsLoading(false);
          form.reset();
        }
      }
    );  
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardHeader>
            <CardTitle>Password Security</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} disabled={isLoading} type={showCurrentPassword ? "text" : "password"} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} disabled={isLoading} type={showNewPassword ? "text" : "password"} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} disabled={isLoading} type={showConfirmPassword ? "text" : "password"} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md flex items-start space-x-2">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>Strong passwords include a mix of uppercase letters, lowercase letters, numbers, and special characters.</div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
