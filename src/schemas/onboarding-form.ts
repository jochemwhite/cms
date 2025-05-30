import { z } from "zod";

export const OnboardingSchema = z
  .object({
    firstname: z.string().min(2, {
      message: "Fist name must be at least 2 characters.",
    }),
    lastname: z.string().min(2, {
      message: "Last name must be at least 2 characters.",
    }),
    profileImage: z.any().optional(),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type OnboardingFormValues = z.infer<typeof OnboardingSchema>;