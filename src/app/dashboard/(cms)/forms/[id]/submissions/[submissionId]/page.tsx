import { getFormById, getFormSubmissionById } from "@/actions/cms/form-actions";
import { FormSubmissionDetail } from "@/components/cms/forms/form-submission-detail";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface SubmissionDetailPageProps {
  params: Promise<{ id: string; submissionId: string }>;
}

export const metadata: Metadata = {
  title: "Submission Details",
  description: "View a form submission in detail.",
};

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id, submissionId } = await params;

  const [formResult, submissionResult] = await Promise.all([
    getFormById(id),
    getFormSubmissionById(id, submissionId),
  ]);

  if (!formResult.success || !formResult.data) {
    notFound();
  }

  if (!submissionResult.success || !submissionResult.data) {
    notFound();
  }

  return (
    <FormSubmissionDetail
      form={formResult.data}
      submission={submissionResult.data}
    />
  );
}
