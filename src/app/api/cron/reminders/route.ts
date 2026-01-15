import { NextRequest, NextResponse } from "next/server";
import { sendBookingReminders } from "@/app/actions/reminders";

/**
 * API endpoint for sending booking reminders
 * This should be called by a cron job daily
 *
 * Setup:
 * 1. Vercel: Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/reminders",
 *        "schedule": "0 9 * * *"
 *      }]
 *    }
 *
 * 2. Manual: Use a service like cron-job.org to hit this endpoint
 *
 * Security: Add CRON_SECRET to env and validate it here
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line no-console
    console.log("[CRON] Starting booking reminders job");

    const result = await sendBookingReminders();

    // eslint-disable-next-line no-console
    console.log("[CRON] Reminders job complete:", result);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Reminders job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send reminders",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
