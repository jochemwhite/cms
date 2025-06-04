import SingInForm from "@/components/auth/SingInForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SparklesCore } from "@/components/ui/sparkles";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect } from "next/navigation";

export default async function Home() { 
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (data?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
      <div className="w-full absolute inset-0 ">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={20}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />

      </div>
      <Card className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input   z-10">
        <CardHeader>
          <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">Welcome to the Amrio portal</h2>
          <p className="text-neutral-600 text-sm max-w-sm  dark:text-neutral-300">Login to the portal to manage your content.</p>
        </CardHeader>

        <CardContent>
          <SingInForm />
        </CardContent>
      </Card>
    </div>
  );
}
