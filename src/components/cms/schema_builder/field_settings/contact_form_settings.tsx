"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { getFormsForActiveWebsite } from "@/actions/cms/form-actions"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ContactFormSettingsProps = {
  value: Record<string, unknown> | null
  setValue: (value: Record<string, unknown> | null) => void
  open?: boolean
  collectionId?: string | null
  setCollectionId?: (value: string | null) => void
  formId?: string | null
  setFormId?: (value: string | null) => void
  error?: string | null
  onCollectionTouched?: () => void
  onFormTouched?: () => void
}

export function ContactFormSettings({
  open = false,
  formId,
  setFormId,
  error,
  onFormTouched,
}: ContactFormSettingsProps) {
  const [forms, setForms] = useState<Array<{ id: string; name: string }>>([])
  const [hasLoadedForms, setHasLoadedForms] = useState(false)
  const [isLoadingForms, setIsLoadingForms] = useState(false)
  const [formsError, setFormsError] = useState<string | null>(null)

  const load_forms_once = useCallback(async () => {
    if (hasLoadedForms || isLoadingForms) {
      return
    }

    setIsLoadingForms(true)
    setFormsError(null)
    try {
      const result = await getFormsForActiveWebsite()
      if (!result.success || !result.data) {
        setFormsError(result.error ?? "Unable to load forms.")
        return
      }

      setForms(
        result.data.map((form) => ({
          id: form.id,
          name: form.name,
        })),
      )
      setHasLoadedForms(true)
    } finally {
      setIsLoadingForms(false)
    }
  }, [hasLoadedForms, isLoadingForms])

  useEffect(() => {
    if (!open || hasLoadedForms || isLoadingForms) {
      return
    }

    void load_forms_once()
  }, [open, hasLoadedForms, isLoadingForms, load_forms_once])

  return (
    <Field>
      <FieldLabel>Contact form *</FieldLabel>
      <Select
        value={formId ?? ""}
        onValueChange={(nextValue) => {
          setFormId?.(nextValue || null)
          onFormTouched?.()
        }}
        disabled={isLoadingForms}
        onOpenChange={(isOpen) => {
          if (isOpen) return
          onFormTouched?.()
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              isLoadingForms
                ? "Loading forms..."
                : forms.length === 0
                  ? "No forms available"
                  : "Select a form"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {forms.map((form) => (
            <SelectItem key={form.id} value={form.id}>
              {form.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoadingForms ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading forms...</span>
        </div>
      ) : null}
      <FieldDescription>Pick a form built for this website. It will be embedded on the page via this field.</FieldDescription>
      {formsError ? <p className="text-xs text-rose-400">{formsError}</p> : null}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </Field>
  )
}
