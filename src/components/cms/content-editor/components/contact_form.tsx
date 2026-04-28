"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2 } from "lucide-react"

import { getFormById } from "@/actions/cms/form-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FieldComponentProps, useContentEditorStore } from "@/stores/content-editor-store"

export default function ContactFormField({ field, fieldId }: FieldComponentProps) {
  const { getFieldFormId } = useContentEditorStore()
  const formId = getFieldFormId(field.id)

  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [published, setPublished] = useState<boolean | null>(null)

  useEffect(() => {
    if (!formId) {
      setName(null)
      setPublished(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    void getFormById(formId).then((result) => {
      if (cancelled) return
      setIsLoading(false)
      if (result.success && result.data) {
        setName(result.data.name)
        setPublished(result.data.published)
      } else {
        setName(null)
        setPublished(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [formId])

  if (!formId) {
    return (
      <div className="space-y-2">
        <Label>{field.name}</Label>
        <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
          <p className="text-sm">No form is configured for this field.</p>
          <p className="mt-1 text-xs">Choose a form in the schema editor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={fieldId}>
          {field.name}
          {field.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        ) : published !== null ? (
          <Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>
        ) : null}
      </div>

      <div className="rounded-lg border border-white/10 bg-muted/20 p-4 text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Loading form…</p>
        ) : name ? (
          <p>
            <span className="font-medium">{name}</span>
          </p>
        ) : (
          <p className="text-muted-foreground">Form could not be loaded.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/dashboard/forms/${formId}`}>
              Edit form
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
    </div>
  )
}
