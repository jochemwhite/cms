// app/api/auth/callback/route.ts

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const response = await fetch("https://moneybird.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: env.NEXT_PUBLIC_MONEYBIRD_CLIENT_ID,
      client_secret: env.MONEYBIRD_CLIENT_SECRET,
      redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/moneybird/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error: "Token exchange failed", details: error }, { status: 500 });
  }

  const data = await response.json();

  await supabaseAdmin.from("moneybird").upsert(
    {
      id: "b9e1b6f7-99e2-4e91-a7b7-b8b8f07e4c6e",
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    },
    {
      onConflict: "id",
    }
  );

  return NextResponse.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  });
}
