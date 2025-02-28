"use server";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { Database } from "@/types/supabase";
import { z } from "zod";

const schema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  avatar: z.string(),
  password: z.string(),
});

export default async function onboardUser({ avatar, first_name, last_name, id, password }: z.infer<typeof schema>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update({
      avatar: avatar,
      first_name: first_name,
      last_name: last_name,
    })
    .eq("user_id", id);
}
