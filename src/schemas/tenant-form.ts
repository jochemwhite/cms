import { z } from "zod";


export const TenantSchema = z.object({
  tenant_name: z.string().min(2, { message: "Tenant name must be at least 2 characters." }),
  tenant_type: z.enum(["business", "individual", "non-profit"], {
    required_error: "Please select a tenant type.",
  }),
  contact_email: z.string().email({ message: "Please enter a valid email address." }),
  contact_name: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
  billing_address_line1: z.string().min(1, { message: "Address line 1 is required." }),
  billing_address_line2: z.string().optional(),
  billing_city: z.string().min(1, { message: "City is required." }),
  billing_postal_code: z.string().min(1, { message: "Postal code is required." }),
  billing_country: z.string().min(1, { message: "Country is required." }),
  status: z.enum(["active", "inactive", "pending"], {
    required_error: "Please select a status.",
  }),
})

export type TenantFormValues = z.infer<typeof TenantSchema>;