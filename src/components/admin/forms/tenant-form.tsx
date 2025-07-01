"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Building, Package, Globe, StickyNote } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@supabase/supabase-js";
import { UserSelect } from "@/components/form-components/user-select";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField, Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTenant } from "@/actions/tenant/tenant-management";

export type TenantFormValues = {
  name: string;
  billing_slug?: string;
  logo_url?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  address2?: string;
  postal_code?: string;
  city?: string;
  website?: string;
  notes?: string;
  createStripe?: boolean;
  createMoneybird?: boolean;
  createPax8?: boolean;
  selfServiceAllowed?: boolean;
  orderApprovalRequired?: boolean;
  primary_contact_user_id?: string;
  isBusinessContact?: boolean;
  company_name?: string;
  firstname?: string;
  lastname?: string;
  vat_number?: string;
  kvk_number?: string;
  stateOrProvince?: string;
  country?: string;
  externalId?: string;
  billOnBehalfOfEnabled?: boolean;
  business_type?: string;
};

interface TenantFormProps {
  initialValues?: Partial<TenantFormValues>;
}

export function TenantForm({ initialValues = {} }: TenantFormProps) {
  const formMethods = useForm<TenantFormValues>({
    defaultValues: {
      name: initialValues.name || "",
      billing_slug: initialValues.billing_slug || "",
      logo_url: initialValues.logo_url || "",
      contact_email: initialValues.contact_email || "",
      phone: initialValues.phone || "",
      address: initialValues.address || "",
      address2: initialValues.address2 || "",
      postal_code: initialValues.postal_code || "",
      city: initialValues.city || "",
      website: initialValues.website || "",
      notes: initialValues.notes || "",
      createStripe: initialValues.createStripe || false,
      createMoneybird: initialValues.createMoneybird || false,
      createPax8: initialValues.createPax8 || false,
      selfServiceAllowed: initialValues.selfServiceAllowed || false,
      orderApprovalRequired: initialValues.orderApprovalRequired || false,
      primary_contact_user_id: initialValues.primary_contact_user_id || undefined,
      isBusinessContact: initialValues.isBusinessContact || true,
      company_name: initialValues.company_name || "",
      firstname: initialValues.firstname || "",
      lastname: initialValues.lastname || "",
      vat_number: initialValues.vat_number || "",
      kvk_number: initialValues.kvk_number || "",
      stateOrProvince: initialValues.stateOrProvince || "",
      country: initialValues.country || "",
      externalId: initialValues.externalId || "",
      billOnBehalfOfEnabled: initialValues.billOnBehalfOfEnabled || false,
    },
  });
  const { handleSubmit, setValue, watch, formState, reset, getValues } = formMethods;
  const form = watch();
  const createStripe = watch("createStripe");
  const createMoneybird = watch("createMoneybird");
  const createPax8 = watch("createPax8");
  const isBusinessContact = watch("isBusinessContact", true);
  const [uploading, setUploading] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(form.logo_url || null);
  const supabase = React.useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const { isSubmitting } = formState;

  // Clear fields when switching between business and individual
  React.useEffect(() => {
    if (isBusinessContact) {
      // Switching to business: clear individual fields
      setValue("firstname", "");
      setValue("lastname", "");
    } else {
      // Switching to individual: clear business fields
      setValue("name", "");
      setValue("vat_number", "");
      setValue("kvk_number", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBusinessContact]);

  function handleSwitchChange(name: keyof TenantFormValues, checked: boolean) {
    setValue(name, checked);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `tenant-logos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage.from("public").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(fileName);
      setValue("logo_url", urlData.publicUrl);
      setLogoPreview(urlData.publicUrl);
    } catch (err) {
      alert("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: TenantFormValues) {
    try {
      await createTenant(values);
      toast.success("Tenant created");
    } catch (error) {
      toast.error("Failed to create tenant");
    }
  }

  return (
    <Card className="shadow-lg  max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Tenant Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-2">
              <FormField
                name="isBusinessContact"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel htmlFor="isBusinessContact">Business</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} id="isBusinessContact" />
                      </FormControl>
                      <FormLabel htmlFor="isBusinessContact">Individual</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {isBusinessContact ? (
              <>
                <FormField
                  name="name"
                  rules={{
                    required: createStripe || createMoneybird ? "Tenant Name is required" : false,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tenant Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Corp" className="focus-visible:ring-2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="vat_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="VAT Number" className="focus-visible:ring-2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="kvk_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KVK Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Chamber of Commerce (KVK)" className="focus-visible:ring-2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="firstname"
                  rules={{
                    required: createMoneybird ? "First name is required for individual" : false,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="First Name" className="focus-visible:ring-2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="lastname"
                  rules={{
                    required: createMoneybird ? "Last name is required for individual" : false,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Last Name" className="focus-visible:ring-2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="billing_slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="acme-corp" className="focus-visible:ring-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                  <Input id="logo_upload" name="logo_upload" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                </FormControl>
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 h-16 w-16 object-contain rounded bg-muted" />}
              </FormItem>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="contact_email"
                rules={{
                  required: createStripe ? "Email is required for Stripe" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-2 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="info@acme.com" className="pl-8 focus-visible:ring-2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phone"
                rules={{
                  required: createStripe ? "Phone is required for Stripe" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-2 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="+31 6 12345678" className="pl-8 focus-visible:ring-2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="address"
                rules={{
                  required: createStripe ? "Address is required for Stripe" : createPax8 ? "Street is required for Pax8" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-2 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="Street 1" className="pl-8 focus-visible:ring-2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="address2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address 2</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street 2 / Suite / Apt" className="focus-visible:ring-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="stateOrProvince"
                rules={{
                  required: createStripe ? "State or Province is required for Stripe" : createPax8 ? "State or Province is required for Pax8" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="State or Province" className="focus-visible:ring-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="city"
                rules={{
                  required: createStripe ? "City is required for Stripe" : createPax8 ? "City is required for Pax8" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-2 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="City" className="pl-8 focus-visible:ring-2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="country"
                rules={{
                  required: createStripe ? "Country is required for Stripe" : createPax8 ? "Country is required for Pax8" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Country (e.g. US, NL)" className="focus-visible:ring-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="postal_code"
                rules={{
                  required: createStripe ? "Postal code is required for Stripe" : createPax8 ? "Postal code is required for Pax8" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-2 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="1234AB" className="pl-8 focus-visible:ring-2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="website"
                rules={{
                  required: createPax8 ? "Website is required for Pax8" : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-2 inset-y-0 my-auto h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="https://acme.com" className="pl-8 focus-visible:ring-2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea {...field} placeholder="Internal notes about this tenant" className="focus-visible:ring-2" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <fieldset className="border rounded-md p-4">
              <legend className="text-sm font-semibold mb-2">Integrations</legend>
              <div className="flex flex-wrap gap-6">
                <FormField
                  name="createStripe"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} id="createStripe" />
                        </FormControl>
                        <FormLabel htmlFor="createStripe">Create in Stripe</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  name="createMoneybird"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} id="createMoneybird" />
                        </FormControl>
                        <FormLabel htmlFor="createMoneybird">Create in Moneybird</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  name="createPax8"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} id="createPax8" />
                        </FormControl>
                        <FormLabel htmlFor="createPax8">Create in Pax8</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>
            <FormField
              name="primary_contact_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact User</FormLabel>
                  <FormControl>
                    <UserSelect
                      value={field.value}
                      onChange={(id: string) => {
                        field.onChange(id);
                        // setSheetOpen(true);
                      }}
                      placeholder="Select a user"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || uploading} className="w-full mt-2">
              {isSubmitting ? "Saving..." : uploading ? "Uploading..." : "Save Tenant"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
