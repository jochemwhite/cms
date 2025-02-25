"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: z.infer<typeof schema>) {
  const supabase = await createClient();

  const result = schema.safeParse(formData);
  if (!result.success) {
    redirect("/error");
  }

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    console.log(error);
    return;
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: z.infer<typeof schema>) {
  const supabase = await createClient();

  const result = schema.safeParse(formData);
  if (!result.success) {
    console.log(result.error);
    redirect("/error");
  }

  const { error, data } = await supabase.auth.signUp(result.data);

  if (error) {
    console.log(error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
