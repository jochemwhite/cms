import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Tailwind,
  Img,
  Hr,
} from "@react-email/components";

export interface FormSubmissionNotificationProps {
  recipientName: string;
  formName: string;
  submittedAt: string;
  viewUrl: string;
  fields: { label: string; value: string }[];
}

export default function FormSubmissionNotification({
  recipientName = "User",
  formName = "Contact Form",
  submittedAt = "April 25, 2026 at 9:00 AM",
  viewUrl = "https://portal.amrio.nl/dashboard/forms",
  fields = [
    { label: "Name", value: "John Doe" },
    { label: "Email", value: "john@example.com" },
  ],
}: FormSubmissionNotificationProps) {
  const logoUrl =
    "https://cdn.amrio.nl/tenants/a57afac3-85a8-4973-ab97-d00e9f7f0bc9/websites/027fdca2-2407-4b24-b8b8-5d7febf9ee8c/media/31426be6-ceb2-48dc-b7d0-0348ee2fb938-amrio-logo.png";

  const previewFields = fields.slice(0, 5);

  return (
    <Html lang="en">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans text-gray-800">
          <Container className="mx-auto my-10 p-8 bg-white rounded-lg max-w-md">
            <Section className="text-center mb-6">
              <Img
                src={logoUrl}
                width="120"
                height="120"
                alt="Amrio"
                className="mx-auto mb-4"
              />
              <Text className="text-2xl font-bold text-blue-600 m-0">
                New Form Submission
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            <Section className="mb-6">
              <Text className="text-base leading-relaxed">
                Hi {recipientName},
              </Text>
              <Text className="text-base leading-relaxed">
                Your form <strong>{formName}</strong> received a new submission
                on {submittedAt}.
              </Text>
            </Section>

            {previewFields.length > 0 && (
              <Section className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Submission Summary
                </Text>
                {previewFields.map((field, i) => (
                  <Text key={i} className="text-sm leading-relaxed m-0 mb-1">
                    <span className="text-gray-500">{field.label}:</span>{" "}
                    {field.value}
                  </Text>
                ))}
                {fields.length > 5 && (
                  <Text className="text-xs text-gray-400 mt-2">
                    +{fields.length - 5} more field
                    {fields.length - 5 !== 1 ? "s" : ""}
                  </Text>
                )}
              </Section>
            )}

            <Section className="text-center my-8">
              <Button
                href={viewUrl}
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md"
              >
                View Submission
              </Button>
            </Section>

            <Hr className="border-gray-200 my-6" />

            <Section className="text-center">
              <Text className="text-sm text-gray-500">
                You are receiving this because you enabled notifications for
                this form. You can change this in your notification settings.
              </Text>
              <Text className="text-sm text-gray-500 mt-4">
                Best regards,
                <br />
                Amrio Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
