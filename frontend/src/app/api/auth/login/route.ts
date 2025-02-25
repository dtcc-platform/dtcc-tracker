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
    const authToken = data.access_token; // Assuming Django returns a JWT token
    const refreshToken = data.refresh_token; // Assuming Django returns a refresh token
    return NextResponse.json({ token: authToken, refreshToken:refreshToken, user: data.user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
