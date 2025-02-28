"use client";

import { CardFooter } from "@/components/ui/card";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "../ui/file-upload";
import { createClient } from "@/lib/supabase/supabaseClient";
import { Database } from "@/types/supabase";
import { ifError } from "assert";

// Define the form schema with Zod
const formSchema = z
  .object({
    firstname: z.string().min(2, {
      message: "Fist name must be at least 2 characters.",
    }),
    lastname: z.string().min(2, {
      message: "Last name must be at least 2 characters.",
    }),
    profileImage: z.instanceof(File).optional(),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    // upload file supabase
    if (values.profileImage) {
      const type = values.profileImage?.type.split("/")[0];
      const { data, error } = await supabase.storage.from("users").upload(`/profile_images/${user.id}-profile_image.${type}`, values.profileImage);

      if (error) {
        console.log(error);
        return;
      }
    }


    
    try {
      // Here you would typically send the data to your API
      console.log("Form submitted:", values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to dashboard or home page after successful onboarding
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
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
