"use client";
import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useUserSession } from "@/providers/session-provider";
import { Database } from "@/types/supabase";
import { updateUser } from "@/actions/authentication/user-settings";

interface ProfileSectionProps {
  user: Database["public"]["Tables"]["users"]["Row"];
  staggerIndex?: number;
}

export const profileFormSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name must be less than 50 characters" }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name must be less than 50 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, staggerIndex = 0 }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { userSession } = useUserSession();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email,
    },
  });

  useEffect(() => {
    form.setValue("first_name", user.first_name || "");
    form.setValue("last_name", user.last_name || "");
    form.setValue("email", user.email);
  }, [user]);

  const handleSave = async (values: z.infer<typeof profileFormSchema>) => {
    setIsLoading(true);

    toast.promise(
      async () =>
        updateUser(values).then((res) => {
          if (!res.success) throw new Error(res.error);
          return res;
        }),
      {
        loading: "Saving...",
        success: (res) => {
          return "Profile updated successfully";
        },
        error: (err) => {
          handleReset();
          return err.message || "Failed to save profile";
        },
        finally() {
          setIsLoading(false);
        },
      }
    );
  };

  const handleReset = () => {
    form.reset({
      last_name: user.last_name || "",
      first_name: user.first_name || "",
      email: user.email,
    });
  };

  const isFormDirty = form.formState.isDirty;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)}>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
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
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-muted/50" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
