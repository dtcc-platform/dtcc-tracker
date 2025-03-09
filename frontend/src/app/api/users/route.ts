import { NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

// GET = list users
export async function GET(req: Request) {
  // Grab Authorization header from the incoming request
  const authHeader = req.headers.get("Authorization") || "";

  const response = await fetch(`${BASE_URL}users/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Forward the same auth header to Django
      Authorization: authHeader,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// POST = create new user
export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const body = await req.json();

  const response = await fetch(`${BASE_URL}users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
