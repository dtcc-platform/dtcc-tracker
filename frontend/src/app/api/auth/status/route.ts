import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";
const DJANGO_API_URL = `${BASE_URL}auth/token/verify/`; // Update with your Django server URL

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        // Forward the request to Django's token verification endpoint
        const djangoResponse = await fetch(DJANGO_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token }),
        });

        const data = await djangoResponse.json();
        if (djangoResponse.ok) {
            return NextResponse.json({ is_superuser: data.is_superuser, username: data.username, valid: true, message: "Token is valid" }, { status: 200 });
        } else {
            return NextResponse.json({ valid: false, message: "Invalid or expired token", error: data }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
    }
}
