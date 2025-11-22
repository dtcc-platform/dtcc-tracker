import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function POST(req: NextRequest) {
  try {
    // Forward the logout request to Django
    const djangoResponse = await fetch(`${BASE_URL}auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward cookies to Django
        "Cookie": req.headers.get("cookie") || ""
      },
      credentials: "include"
    });

    // Create response
    const response = NextResponse.json({
      message: "Logged out successfully"
    }, { status: 200 });

    // Clear the authentication cookies
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    });

    return response;
  } catch (error) {
    return NextResponse.json({
      error: "Logout failed",
      details: error
    }, { status: 500 });
  }
}