import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const { mobile_no, message } = body;

        console.log("[SMS Webhook] Received request:", {
            mobile_no,
            message: message?.substring(0, 50) + "...",
            timestamp: new Date().toISOString(),
        });

        // Validate required fields
        if (!mobile_no || !message) {
            return NextResponse.json(
                { error: "mobile_no and message are required" },
                { status: 400 }
            );
        }

        // Send SMS via Twilio
        const twilioMessage = await twilioClient.messages.create({
            body: message,
            to: mobile_no,
            from: process.env.TWILIO_PHONE_NUMBER!,
        });

        console.log("[SMS Webhook] Message sent successfully:", {
            sid: twilioMessage.sid,
            status: twilioMessage.status,
            to: mobile_no,
        });
        console.log("twilioMessage", twilioMessage);
        console.log("twilioMessage.status", twilioMessage.status);
        return NextResponse.json({
            success: true,
            messageSid: twilioMessage.sid,
            status: twilioMessage.status,
        });
    } catch (error) {
        console.error("[SMS Webhook] Error sending SMS:", error);
        return NextResponse.json(
            {
                error: "Failed to send SMS",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
