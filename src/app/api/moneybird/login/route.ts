import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const clientId = env.NEXT_PUBLIC_MONEYBIRD_CLIENT_ID!;
const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/moneybird/callback`;

export function GET(req: NextRequest, res: NextResponse) {
  const scopes = ["sales_invoices", "documents", "estimates", "bank", "time_entries", "settings"];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
  });

  const authUrl = `https://moneybird.com/oauth/authorize?${params.toString()}`;

  // Redirect user to Moneybird OAuth page
  return NextResponse.redirect(authUrl);
}
