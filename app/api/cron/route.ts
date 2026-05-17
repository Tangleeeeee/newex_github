import { NextResponse } from "next/server";
import { startCronJobs } from "@/lib/cron";

let cronStarted = false;

export async function GET() {
  if (!cronStarted) {
    startCronJobs();
    cronStarted = true;
  }
  return NextResponse.json({ status: "ok" });
}
