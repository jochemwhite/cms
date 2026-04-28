import { getFormById, getFormSubmissions } from "@/actions/cms/form-actions";
import { FormSubmissionsOverview } from "@/components/cms/forms/form-submissions-overview";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface FormSubmissionsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Form Submissions",
  description: "View form submissions.",
};

export default async function FormSubmissionsPage({ params }: FormSubmissionsPageProps) {
  const { id } = await params;

  const [formResult, submissionsResult] = await Promise.all([
    getFormById(id),
    getFormSubmissions(id),
  ]);

  if (!formResult.success || !formResult.data) {
    notFound();
  }

  const submissions = submissionsResult.success ? (submissionsResult.data ?? []) : [];

  return (
    <FormSubmissionsOverview
      form={formResult.data}
      submissions={submissions}
    />
  );
}
