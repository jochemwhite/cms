"use server";

import { MoneybirdContactResponse, CreateMoneybirdContactRequest } from "@/types/api/moneybird";
import moneybirdAPI from ".";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";

export async function getContacts() {
  const response = await moneybirdAPI.get("/contacts");
  return response.data;
}

export async function createMoneybirdContact(contact: CreateMoneybirdContactRequest, tenantId: string) {
  try {
    const response = await moneybirdAPI.post<MoneybirdContactResponse>("/contacts", { contact });

    const { data, error } = await supabaseAdmin
      .from("tenants")
      .update({ moneybird_contact_id: response.data.id })
      .eq("id", tenantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tenant:", error);
      throw error;
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export async function updateContact(id: string, contact: any) {
  try {
    const response = await moneybirdAPI.put(`/contacts/${id}`, contact);
    return response.data;
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
}
