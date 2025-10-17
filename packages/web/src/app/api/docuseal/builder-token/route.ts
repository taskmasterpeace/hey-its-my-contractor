import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, projectId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!process.env.DOCUSEAL_API_KEY) {
      console.error("DOCUSEAL_API_KEY environment variable not set");
      return NextResponse.json(
        { error: "DocuSeal API key not configured" },
        { status: 500 }
      );
    }

    console.log("Generating JWT token for DocuSeal Builder");

    // Generate JWT token using the API key as per DocuSeal documentation
    const payload = {
      user_email: email, // Email of the user creating the template
      integration_email: email, // Email of the user to create template for
      iat: Math.floor(Date.now() / 1000), // Issued at time
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires in 1 hour
    };

    const token = jwt.sign(payload, process.env.DOCUSEAL_API_KEY, {
      algorithm: "HS256",
    });

    console.log("JWT token generated successfully");

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating JWT token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
