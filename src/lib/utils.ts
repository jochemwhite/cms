import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LANGUAGE_OPTIONS = [
  { value: "nl-NL", label: "Dutch" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "pt-PT", label: "Portuguese" },
];



export const TIMEZONE_OPTIONS = [
  {
    label: "UTC+14:00 – Kiritimati, Kiribati (LINT)",
    value: "Pacific/Kiritimati",
  },
  {
    label: "UTC+13:00 – Nukuʻalofa, Tonga (TOT)",
    value: "Pacific/Tongatapu",
  },
  {
    label: "UTC+12:45 – Chatham Islands, New Zealand (CHAST)",
    value: "Pacific/Chatham",
  },
  {
    label: "UTC+12:00 – Auckland, New Zealand (NZST)",
    value: "Pacific/Auckland",
  },
  {
    label: "UTC+11:00 – Honiara, Solomon Islands (SBT)",
    value: "Pacific/Guadalcanal",
  },
  {
    label: "UTC+10:30 – Lord Howe Island, Australia (LHST)",
    value: "Australia/Lord_Howe",
  },
  {
    label: "UTC+10:00 – Sydney, Australia (AEST)",
    value: "Australia/Sydney",
  },
  {
    label: "UTC+09:30 – Adelaide, Australia (ACST)",
    value: "Australia/Adelaide",
  },
  {
    label: "UTC+09:00 – Tokyo, Japan (JST)",
    value: "Asia/Tokyo",
  },
  {
    label: "UTC+08:45 – Eucla, Australia (ACWST)",
    value: "Australia/Eucla",
  },
  {
    label: "UTC+08:00 – Beijing, China (CST)",
    value: "Asia/Shanghai",
  },
  {
    label: "UTC+07:00 – Bangkok, Thailand (WIB)",
    value: "Asia/Bangkok",
  },
  {
    label: "UTC+06:30 – Yangon, Myanmar (MMT)",
    value: "Asia/Yangon",
  },
  {
    label: "UTC+06:00 – Dhaka, Bangladesh (BST)",
    value: "Asia/Dhaka",
  },
  {
    label: "UTC+05:45 – Kathmandu, Nepal (NPT)",
    value: "Asia/Kathmandu",
  },
  {
    label: "UTC+05:30 – New Delhi, India (IST)",
    value: "Asia/Kolkata",
  },
  {
    label: "UTC+05:00 – Karachi, Pakistan (PKT)",
    value: "Asia/Karachi",
  },
  {
    label: "UTC+04:30 – Kabul, Afghanistan (AFT)",
    value: "Asia/Kabul",
  },
  {
    label: "UTC+04:00 – Dubai, UAE (GST)",
    value: "Asia/Dubai",
  },
  {
    label: "UTC+03:30 – Tehran, Iran (IRST)",
    value: "Asia/Tehran",
  },
  {
    label: "UTC+03:00 – Nairobi, Kenya (EAT)",
    value: "Africa/Nairobi",
  },
  {
    label: "UTC+02:00 – Berlin, Germany (CEST)",
    value: "Europe/Berlin",
  },
  {
    label: "UTC+01:00 – London, UK (BST)",
    value: "Europe/London",
  },
  {
    label: "UTC+00:00 – Accra, Ghana (GMT)",
    value: "Africa/Accra",
  },
  {
    label: "UTC-01:00 – Praia, Cape Verde (CVT)",
    value: "Atlantic/Cape_Verde",
  },
  {
    label: "UTC-02:00 – Fernando de Noronha, Brazil (FNT)",
    value: "America/Noronha",
  },
  {
    label: "UTC-02:30 – St. John's, Canada (NDT)",
    value: "America/St_Johns",
  },
  {
    label: "UTC-03:00 – São Paulo, Brazil (BRT)",
    value: "America/Sao_Paulo",
  },
  {
    label: "UTC-04:00 – New York, USA (EDT)",
    value: "America/New_York",
  },
  {
    label: "UTC-05:00 – Chicago, USA (CDT)",
    value: "America/Chicago",
  },
  {
    label: "UTC-06:00 – Mexico City, Mexico (CST)",
    value: "America/Mexico_City",
  },
  {
    label: "UTC-07:00 – Denver, USA (MDT)",
    value: "America/Denver",
  },
  {
    label: "UTC-08:00 – Los Angeles, USA (PDT)",
    value: "America/Los_Angeles",
  },
  {
    label: "UTC-09:00 – Anchorage, USA (AKDT)",
    value: "America/Anchorage",
  },
  {
    label: "UTC-09:30 – Taiohae, French Polynesia (MART)",
    value: "Pacific/Marquesas",
  },
  {
    label: "UTC-10:00 – Honolulu, USA (HST)",
    value: "Pacific/Honolulu",
  },
  {
    label: "UTC-11:00 – Alofi, Niue (NUT)",
    value: "Pacific/Niue",
  },
  {
    label: "UTC-12:00 – Baker Island, US Minor Outlying Islands (AoE)",
    value: "Etc/GMT+12",
  },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

export const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
  { value: "custom", label: "Custom" },
];
