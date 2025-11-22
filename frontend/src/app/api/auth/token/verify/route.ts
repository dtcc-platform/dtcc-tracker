import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function POST(req: NextRequest) {
  try {
    // Get the access token from cookies
    const accessToken = req.cookies.get('access_token');

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Forward the request to Django's token verification endpoint
    const djangoResponse = await fetch(`${BASE_URL}auth/token/verify/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `access_token=${accessToken.value}`
      },
      credentials: "include"
    });

    if (djangoResponse.ok) {
      const data = await djangoResponse.json();
      return NextResponse.json({
        valid: true,
        username: data.username,
        is_superuser: data.is_superuser,
        message: "Token is valid"
      }, { status: 200 });
    } else {
      return NextResponse.json({
        valid: false,
        message: "Invalid or expired token"
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      error: "Internal server error",
      details: error
    }, { status: 500 });
  }
}