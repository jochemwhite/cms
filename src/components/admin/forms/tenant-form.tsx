"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, Globe, Mail, Upload, X } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { LANGUAGE_OPTIONS, PLAN_OPTIONS, STATUS_OPTIONS } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TenantSchema, type TenantFormValues } from "@/schemas/tenant-form";
import { UserSelect } from "../../form-components/user-select";
import { CountrySelect } from "@/components/form-components/country-select";
import { useCountriesAndStates } from "@/hooks/use-countries-states";
import { StateSelect } from "@/components/form-components/state-select";

export const TenantForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userDialogOpen, setUserDialogOpen] = React.useState(false);
  const { countries, states, loadingCountries, loadingStates, fetchStates } = useCountriesAndStates();
 
 
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(TenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo_url: "",
      language: "en-US",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      status: "active",
      plan: "free",
      custom_domain: "",
      billing_email: "",
      primary_contact: "",
      phone: "",
    },
  });

  // Auto-generate slug from name
  React.useEffect(() => {
    const name = form.watch("name");
    if (name && !form.getValues("slug")) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  }, [form.watch("name")]);

  React.useEffect(() => {
    console.log(form.watch());
  }, [form.watch()]);

  // Fetch states when country changes
  React.useEffect(() => {
    const country = form.watch("country");
    if (typeof country === "string" && country.length > 0) {
      fetchStates(country);
    }
  }, [form.watch("country")]);


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server and get a URL back
      // For this demo, we'll create a local object URL
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
      form.setValue("logo_url", `uploaded-${file.name}`); // In real app, this would be the URL from the server
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue("logo_url", "");
  };

  const onSubmit = async (data: TenantFormValues) => {
    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      setFormSuccess("Tenant created successfully!");
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Tenant</CardTitle>
        <CardDescription>Configure a new tenant account with all necessary information.</CardDescription>
      </CardHeader>
      <CardContent className="shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium border-l-4 border-primary pl-3">Basic Information</h2>
                <p className="text-sm text-muted-foreground">Enter the tenant's basic details</p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant Slug</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Building2 className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                              placeholder="acme-corporation"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                field.onChange(value);
                              }}
                            />
                            {field.value && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <div className="text-xs text-muted-foreground">{`${field.value}.yourdomain.com`}</div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Used for the tenant subdomain: [slug].yourdomain.com</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-medium border-l-4 border-primary pl-3">Account Status</h2>
                <p className="text-sm text-muted-foreground">Set the tenant's plan and current status</p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "active"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "free"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLAN_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact & Localization */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-medium border-l-4 border-primary pl-3">Contact & Localization</h2>
                <p className="text-sm text-muted-foreground">Set contact information and regional settings</p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input type="email" placeholder="billing@acme.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primary_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact</FormLabel>
                        <UserSelect
                          value={field.value}
                          onChange={(val) => {
                            console.log(val);
                            field.onChange(val);
                          }}
                          onCreateNew={() => setUserDialogOpen(true)}
                        />
                        <FormMessage />
                        {/* <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New User</DialogTitle>
                              <DialogDescription>Fill in the details to add a new user.</DialogDescription>
                            </DialogHeader>
                            <UserCreationForm
                              onSuccess={(newUser) => {
                                form.setValue("primary_contact", newUser.id);
                                setSelectedContact(newUser.id);
                                setUserDialogOpen(false);
                              }}
                            />
                          </DialogContent>
                        </Dialog> */}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "en-US"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-medium border-l-4 border-primary pl-3">Address Information</h2>
                <p className="text-sm text-muted-foreground">Set the tenant's physical address</p>

                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Suite 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                              <StateSelect
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                                states={states}
                                value={field.value || ""}
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="94103" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <CountrySelect
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            countries={countries}
                            value={field.value || ""}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Domain */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-medium border-l-4 border-primary pl-3">Domain Configuration</h2>
                <p className="text-sm text-muted-foreground">Configure custom domain settings</p>

                <FormField
                  control={form.control}
                  name="custom_domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Domain</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input placeholder="app.acmecorp.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>Leave empty to use the default subdomain</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-medium border-l-4 border-primary pl-3">Tenant Logo</h2>
                <p className="text-sm text-muted-foreground">Upload your organization's logo</p>

                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-col items-center justify-center w-full">
                          <label
                            htmlFor="logo-upload"
                            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                              logoPreview ? "border-primary" : "border-gray-300"
                            }`}
                          >
                            {logoPreview ? (
                              <div className="relative w-full h-full flex items-center justify-center p-6">
                                <img src={logoPreview || "/placeholder.svg"} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                                <button
                                  type="button"
                                  onClick={removeLogo}
                                  className="absolute top-2 right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                                  aria-label="Remove logo"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">SVG, PNG, or JPG (max. 2MB)</p>
                              </div>
                            )}
                            <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </label>
                        </div>
                      </FormControl>
                      <FormDescription>Upload a logo to display in the tenant's dashboard</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Success Message */}
              {formSuccess && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <p className="text-green-700 text-sm">{formSuccess}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    "Create Tenant"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantForm;
