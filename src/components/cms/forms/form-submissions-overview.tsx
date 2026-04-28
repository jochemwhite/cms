"use client";

import { useMemo } from "react";
import { CmsForm, CmsFormSubmission } from "@/actions/cms/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings2 } from "lucide-react";
import Link from "next/link";
import { SubmissionsDataTable } from "./table/submissions-table";
import { buildFieldLabelMap, createSubmissionColumns } from "./table/submissions-table-columns";

interface FormSubmissionsOverviewProps {
  form: CmsForm;
  submissions: CmsFormSubmission[];
}

export function FormSubmissionsOverview({ form, submissions }: FormSubmissionsOverviewProps) {
  const conversionRate = form.visits > 0
    ? ((form.submissions / form.visits) * 100).toFixed(1)
    : "0.0";

  const fieldMap = useMemo(() => buildFieldLabelMap(form.content), [form.content]);
  const columns = useMemo(() => createSubmissionColumns(fieldMap), [fieldMap]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{form.name}</h1>
            <Badge variant={form.published ? "default" : "secondary"}>
              {form.published ? "Published" : "Draft"}
            </Badge>
          </div>
          {form.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/forms/${form.id}`}>
            <Settings2 className="mr-2 h-4 w-4" />
            Open Builder
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submissions</CardDescription>
            <CardTitle className="text-2xl">{form.submissions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visits</CardDescription>
            <CardTitle className="text-2xl">{form.visits.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl">{conversionRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            Click on a submission to view all the details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionsDataTable columns={columns} data={submissions} formId={form.id} />
        </CardContent>
      </Card>
    </div>
  );
}
