"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { z } from "zod";
import { Session, User } from "@supabase/supabase-js";
import { ActionResponse } from "@/types/actions";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: z.infer<typeof schema>): Promise<ActionResponse<{ session: Session }>> {
  const supabase = await createClient();

  const result = schema.safeParse(formData);
  if (!result.success) {
    redirect("/error");
  }

  const { error, data } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    console.log(error);
    return { success: false, error: error.message };
  }

  const {
    data: { session },
  } = await supabase.auth.refreshSession();
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");

  return redirect("/");
}

export async function verifyMfaAction(code: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient(); // server-side supabase client

  const factors = await supabase.auth.mfa.listFactors();
  if (factors.error) {
    return { success: false, error: factors.error.message };
  }

  const totpFactor = factors.data.totp[0];
  if (!totpFactor) {
    return { success: false, error: "No TOTP factors found!" };
  }

  const factorId = totpFactor.id;
  const challenge = await supabase.auth.mfa.challenge({ factorId });

  if (challenge.error) {
    return { success: false, error: challenge.error.message };
  }

  const challengeId = challenge.data.id;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (verify.error) {
    return { success: false, error: verify.error.message };
  }

  revalidatePath("/dashboard", "layout");

  return { success: true };
}
