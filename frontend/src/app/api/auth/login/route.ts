import { BASE_URL } from "@/app/types/FixedTypes";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const djangoResponse = await fetch(`${BASE_URL}auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!djangoResponse.ok) {
      const error = await djangoResponse.json();
      return NextResponse.json({ error: error.detail || "Login failed" }, { status: djangoResponse.status });
    }

    const data = await djangoResponse.json();

    // Create response with user data (no tokens in body)
    const response = NextResponse.json({
      user: data.user.username,
      is_superuser: data.user.is_superuser,
      message: data.message
    }, { status: 200 });

    // Forward the httpOnly cookies from Django to the client
    // Use getSetCookie() to properly get all Set-Cookie headers as an array
    const setCookieHeaders = djangoResponse.headers.getSetCookie();
    setCookieHeaders.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
