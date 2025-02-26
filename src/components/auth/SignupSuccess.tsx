import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useRouter } from "next/navigation";

export default function SignupSuccess() {
  const router = useRouter();
  const [counter, setCounter] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (counter <= 0) {
      router.push("/");
    }
  }, [counter, router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Almost There!</CardTitle>
        <CardDescription>
          A confirmation email has been sent to your inbox. Please check your email and follow the verification link to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm">
          Redirecting to the login page in {counter} second{counter !== 1 && "s"}...
        </p>
      </CardContent>
    </Card>
  );
}
