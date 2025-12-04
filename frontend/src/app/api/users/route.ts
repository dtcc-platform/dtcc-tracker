import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

// GET = list users
export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token');

  const response = await fetch(`${BASE_URL}users/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// POST = create new user
export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get('access_token');
  const body = await req.json();

  const response = await fetch(`${BASE_URL}users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
