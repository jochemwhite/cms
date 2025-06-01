import { createClient  } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { env } from "../env";

const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default supabase;
