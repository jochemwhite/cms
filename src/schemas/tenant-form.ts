import { z } from "zod";

export const TenantSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters." }),
  logo_url: z.string().nullable().optional(),
  status: z
    .enum(["active", "suspended", "trial"], {
      required_error: "Please select a status.",
    })
    .nullable()
    .default("active"),
  plan: z.string().default("free"),
  address1: z.string(),
  address2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  custom_domain: z.string().optional(),
  locale: z.string().default("en-US"),
  timezone: z.string().default("UTC"),
  billing_email: z.string().email().optional(),
  phone: z.string().optional(),
  is_demo: z.boolean().default(false),
  primary_contact: z.string().uuid().optional(),
});

export type TenantFormValues = z.infer<typeof TenantSchema>;
