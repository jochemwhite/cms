"use client";

import { CardFooter } from "@/components/ui/card";3
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { date, z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/supabaseClient";
import { Database } from "@/types/supabase";
import { FileUpload } from "../ui/file-upload";
import { OnboardingFormValues, OnboardingSchema } from "@/schemas/onboarding-form";
import { UpdateUserOnboardingStatus } from "@/actions/authentication/user-management";
import { toast } from "sonner";


interface props {
  user: Database["public"]["Tables"]["users"]["Row"];
}

export default function OnboardingForm({ user }: props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const supabase = createClient();

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  // Initialize the form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      firstname: user.first_name || "",
      lastname: user.last_name || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    const { success, error } = await UpdateUserOnboardingStatus(user.id, values);
    if (!success) {
      toast.error(error || "Something went wrong");
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    toast.success("Onboarding completed successfully");
    router.push("/dashboard");
  };

  // Navigate to next step
  const nextStep = async () => {
    let canProceed = false;

    if (step === 0) {
      const firstNameValid = await form.trigger("firstname");
      const lastNameValid = await form.trigger("lastname");

      canProceed = firstNameValid && lastNameValid;
    } else if (step === 1) {
      // Image is optional, so we can always proceed
      canProceed = true;
    }

    if (canProceed && step < totalSteps - 1) {
      swiperRef.current?.slideNext();
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (step > 0) {
      swiperRef.current?.slidePrev();
    }
  };

  // Update step when Swiper slides change
  const handleSlideChange = (swiper: SwiperType) => {
    setStep(swiper.activeIndex);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 0 && "Personal Information"}
          {step === 1 && "Profile Picture"}
          {step === 2 && "Set Password"}
        </CardTitle>
        <CardDescription>
          {step === 0 && "Let's start with your name"}
          {step === 1 && "Upload a profile picture (optional)"}
          {step === 2 && "Create a secure password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              onSlideChange={handleSlideChange}
              modules={[Navigation, Pagination]}
              slidesPerView={1}
              spaceBetween={30}
              allowTouchMove={false}
              className="h-[300px]"
            >
              <SwiperSlide>
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </SwiperSlide>

              <SwiperSlide>
                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <div className="flex flex-col items-center justify-center gap-4">
                        <FormControl>
                          <div className="grid w-full items-center gap-1.5">
                            <FileUpload onChange={(files) => form.setValue("profileImage", files[0])} />
                          </div>
                        </FormControl>
                        <FormDescription>Upload a square image for best results.</FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </SwiperSlide>

              <SwiperSlide>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormDescription>At least 8 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </SwiperSlide>
            </Swiper>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 0}>
          Back
        </Button>

        {step < totalSteps - 1 ? (
          <Button onClick={nextStep}>Continue</Button>
        ) : (
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
