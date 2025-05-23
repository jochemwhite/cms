import { z } from "zod";

export const TenantSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters." }),
  logo_url: z.string().optional(),
  status: z
    .enum(["active", "suspended", "trial"], {
      required_error: "Please select a status.",
    })
    .default("active"),
  plan: z.string().default("free"),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  custom_domain: z.string().optional(),
  language: z.string().default("en-US"), 
  billing_email: z.string().email().optional(),
  phone: z.string().optional(),
  primary_contact: z.string().uuid().optional(),
});

export type TenantFormValues = z.infer<typeof TenantSchema>;
