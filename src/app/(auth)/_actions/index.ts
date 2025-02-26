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



export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();  
  revalidatePath("/");

  return redirect("/");
}



export async function signup(formData: z.infer<typeof schema>) {
  const supabase = await createClient();

  // Validate the form data
  const result = schema.safeParse(formData);
  if (!result.success) {
    // Use formErrors directly, since it's a string array
    const { formErrors } = result.error.flatten();
    return { error: formErrors.join(", ") };
  }

  // Attempt to sign up the user with Supabase
  const { error, data } = await supabase.auth.signUp(result.data);

  if (error) {
    // Return the error message for display
    console.error(error);
    return { error: error.message };
  }

  // Optionally revalidate your cache if needed
  revalidatePath("/");

  // Return the successful response
  return { data };
}
