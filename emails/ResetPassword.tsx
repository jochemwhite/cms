// emails/ResetPasswordEmail.tsx
import * as React from 'react';
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
} from '@react-email/components';

interface ResetPasswordEmailProps {
  userName: string;
  resetLink: string;
  yourName: string;
}

export const ResetPasswordEmail = ({
  userName,
  resetLink,
  yourName,
}: ResetPasswordEmailProps) => {
  const logoUrl = 'https://xjcvdiidvtccsmbwtdmh.supabase.co/storage/v1/object/public/amrio//logo.png';

  return (
    <Html lang="en">
      <Head />
      <Tailwind>
        <Body className="bg-gray-100 font-sans text-gray-800">
          <Container className="mx-auto my-10 p-8 bg-white rounded-lg shadow-lg max-w-md">
            <Section className="text-center mb-6">
              {/* Logo for Amrio CMS */}
              <Img
                src={logoUrl}
                width="120"
                height="120"
                alt="Amrio CMS Logo"
                className="mx-auto mb-4"
              />
              <Text className="text-2xl font-bold text-blue-600">
                Reset Your Password
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-base leading-relaxed">
                Hi {userName},
              </Text>
              <Text className="text-base leading-relaxed">
                We received a request to reset the password for your account. Click the button below to choose a new password. This link will expire in 24 hours.
              </Text>
            </Section>

            <Section className="text-center my-8">
              <Button
                href={resetLink}
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                Reset Password
              </Button>
              <Text className="text-sm mt-4 text-gray-600">
                If the button above does not work, please copy and paste this link into your browser:
                <br />
                <a href={resetLink} className="text-blue-600 underline break-all">
                  {resetLink}
                </a>
              </Text>
            </Section>

            <Section className="mt-6 text-center text-gray-600 text-sm">
              <Text>
                If you did not request a password reset, please ignore this email or contact support if you have questions.
              </Text>
              <Text className="mt-4">
                Best regards,
                <br />
                {yourName}
              </Text>
              <Text className="mt-4 text-xs">
                This password reset link is valid for 1 hour.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
