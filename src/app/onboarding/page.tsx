import OnboardingForm from "@/components/auth/onboarding-form"
import { createClient } from "@/lib/supabase/supabaseServerClient"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Onboarding | Set up your account",
  description: "Complete your profile setup to get started",
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {data, error } = await supabase.from("users").select("*").single()

  if(error){
    console.log(error)
    redirect("/")
  }


  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome aboard!</h1>
          <p className="text-sm text-muted-foreground">Let's set up your account in just a few steps</p>
        </div>
        <OnboardingForm user={data} />
      </div>
    </div>
  )
}

