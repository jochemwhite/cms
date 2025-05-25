import { z } from "zod";

export const UserSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  global_role: z.enum(["system_admin", "default_user"], {
    required_error: "Please select a role.",
  }),
  send_invite: z.boolean().default(true),
});

export type UserFormValues = z.infer<typeof UserSchema>;
