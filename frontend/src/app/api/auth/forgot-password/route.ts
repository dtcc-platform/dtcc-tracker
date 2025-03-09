import { NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function POST(request: Request) {
  try {
    // 1. Get the email from the request body
    const body = await request.formData(); // or request.json() if you prefer JSON
    const email = body.get("email") as string;

    // 2. Call your Django endpoint
    //    Adjust the URL to match your Django server's location:
    //    For local dev with Django at http://127.0.0.1:8000
    const djangoResponse = await fetch(`${BASE_URL}forgot_password/`, {
      method: "POST",
      body: new URLSearchParams({ email }), // if your Django view expects formdata
    });

    // 3. Parse response from Django
    if (!djangoResponse.ok) {
      const errorData = await djangoResponse.json();
      return NextResponse.json(
        { success: false, message: errorData.message || "Django error" },
        { status: djangoResponse.status }
      );
    }

    const data = await djangoResponse.json();
    // Return success
    return NextResponse.json({
      success: true,
      message: data.message || "Reset email sent if the email is valid.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
