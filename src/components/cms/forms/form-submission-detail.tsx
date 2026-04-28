"use client";

import { CmsForm, CmsFormSubmission } from "@/actions/cms/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Mail, Phone, Globe, Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface FormSubmissionDetailProps {
  form: CmsForm;
  submission: CmsFormSubmission;
}

interface FormField {
  key?: string;
  label?: string;
  type?: string;
}

function buildFieldMap(formContent: unknown): Map<string, FormField> {
  const map = new Map<string, FormField>();
  if (!Array.isArray(formContent)) return map;
  for (const field of formContent) {
    if (field && typeof field === "object" && field.key) {
      map.set(field.key, field as FormField);
    }
  }
  return map;
}

function resolveLabel(key: string, fieldMap: Map<string, FormField>): string {
  const field = fieldMap.get(key);
  if (field?.label) return field.label;
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isLikelyPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[+\d\s().-]+$/.test(value);
}

function isLikelyUrl(value: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(value);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function ContactActions({
  content,
  fieldMap,
}: {
  content: Record<string, unknown>;
  fieldMap: Map<string, FormField>;
}) {
  const actions: { type: "phone" | "email" | "url"; label: string; value: string }[] = [];

  for (const [key, val] of Object.entries(content)) {
    if (typeof val !== "string" || !val.trim()) continue;
    const value = val.trim();
    const fieldDef = fieldMap.get(key);
    const fieldType = fieldDef?.type;

    if (fieldType === "email" || isLikelyEmail(value)) {
      actions.push({ type: "email", label: resolveLabel(key, fieldMap), value });
    } else if (fieldType === "phone" || isLikelyPhone(value)) {
      actions.push({ type: "phone", label: resolveLabel(key, fieldMap), value });
    } else if (fieldType === "url" || isLikelyUrl(value)) {
      actions.push({ type: "url", label: resolveLabel(key, fieldMap), value });
    }
  }

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Contact the person who submitted this form.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, i) => {
            if (action.type === "email") {
              return (
                <Button key={i} variant="outline" size="sm" asChild>
                  <a href={`mailto:${action.value}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email {action.value}
                  </a>
                </Button>
              );
            }
            if (action.type === "phone") {
              return (
                <Button key={i} variant="outline" size="sm" asChild>
                  <a href={`tel:${action.value}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call {action.value}
                  </a>
                </Button>
              );
            }
            if (action.type === "url") {
              const href = action.value.startsWith("http") ? action.value : `https://${action.value}`;
              return (
                <Button key={i} variant="outline" size="sm" asChild>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Website
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              );
            }
            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function FormSubmissionDetail({ form, submission }: FormSubmissionDetailProps) {
  const content = submission.content as Record<string, unknown> | null;
  const metadata = submission.metadata as Record<string, unknown> | null;
  const fieldMap = useMemo(() => buildFieldMap(form.content), [form.content]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/forms/${form.id}/submissions`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Submission Details</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(submission.created_at).toLocaleString("en-US", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>{form.name}</span>
            <Badge variant={form.published ? "default" : "secondary"} className="text-xs">
              {form.published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </div>

      {content && Object.keys(content).length > 0 && (
        <ContactActions content={content} fieldMap={fieldMap} />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Form Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {content && Object.keys(content).length > 0 ? (
            <div className="rounded-md border divide-y">
              {Object.entries(content).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {resolveLabel(key, fieldMap)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {typeof value === "string"
                        ? value || "-"
                        : JSON.stringify(value, null, 2)}
                    </p>
                  </div>
                  {typeof value === "string" && value.trim() && (
                    <CopyButton value={value} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No response data available.</p>
          )}
        </CardContent>
      </Card>

      {metadata && Object.keys(metadata).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Metadata</CardTitle>
            <CardDescription>
              Technical information captured with the submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border divide-y">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {resolveLabel(key, fieldMap)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {typeof value === "string"
                        ? value || "-"
                        : JSON.stringify(value, null, 2)}
                    </p>
                  </div>
                  {typeof value === "string" && value.trim() && (
                    <CopyButton value={value} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
