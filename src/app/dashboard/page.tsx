import { unauthorized } from "next/navigation";
import { createClient } from "@/lib/supabase/supabaseServerClient";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_session");

  if (error) {
    console.log(error);
    return unauthorized();
  }

  return <div>{JSON.stringify(data, null, 2)}</div>;
}
