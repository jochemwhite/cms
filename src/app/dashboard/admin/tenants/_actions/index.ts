"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { TenantFormValues, TenantSchema } from "@/schemas/tenant-form";
import { Database } from "@/types/supabase";
import { z } from "zod";

export async function createTenant(values: TenantFormValues) {
  // validate the form values

  const validatedValues = TenantSchema.parse(values);
  // get the user id

  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("id").single();

  if (error || !data) {
    throw new Error("Failed to get user id.");
  }

  const newTenant: Database["public"]["Tables"]["tenants"]["Insert"] = {
    ...validatedValues,

  };


  // insert the new tenant into the database

  const { error: insertError } = await supabase.from("tenants").insert([newTenant]);

  if (insertError) {
    console.log(insertError);
    throw new Error("Failed to create tenant.");
  }

  return;
}
