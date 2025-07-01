import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import axios from "axios";

let amrioId = "5daa185f-8caa-445d-a96b-28592d2e65ed";

const moneybirdAPI = axios.create({
  baseURL: "https://moneybird.com/api/v2/447241733223221124",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
  },
});

moneybirdAPI.interceptors.request.use(async (config) => {
  const { data, error } = await supabaseAdmin.from("moneybird").select("*").eq("id", amrioId).single();

  if (error) {
    throw error;
  }

  config.headers.Authorization = `Bearer ${data.access_token}`;
  return config;
});

moneybirdAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshMoneybirdToken(amrioId);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return moneybirdAPI(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // If not 401 or already retried, reject
    return Promise.reject(error);
  }
);

export default moneybirdAPI;

async function refreshMoneybirdToken(id: string): Promise<string> {
  // Fetch credentials and refresh token from Supabase
  const { data, error: supabaseError } = await supabaseAdmin.from("moneybird").select("refresh_token").eq("id", id).single();

  if (supabaseError || !data) {
    throw supabaseError || new Error("No Moneybird credentials found");
  }

  // Request new access token

  const tokenResponse = await axios.post(
    "https://moneybird.com/oauth/token",
    {
      params: {
        client_id: env.NEXT_PUBLIC_MONEYBIRD_CLIENT_ID,
        client_secret: env.MONEYBIRD_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: data.refresh_token,
      },
    },
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const { access_token, refresh_token } = tokenResponse.data;

  // Update the new tokens in Supabase
  await supabaseAdmin.from("moneybird").update({ access_token, refresh_token }).eq("id", id);

  return access_token;
}
