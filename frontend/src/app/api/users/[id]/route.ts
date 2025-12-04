import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

interface Params {
  params: Promise<{ id: string }>;
}

// GET single user
export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  const accessToken = req.cookies.get('access_token');

  const response = await fetch(`${BASE_URL}users/${params.id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// PATCH single user (partial update)
export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const accessToken = req.cookies.get('access_token');
  const body = await req.json();

  const response = await fetch(`${BASE_URL}users/${params.id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// DELETE single user
export async function DELETE(req: NextRequest, props: Params) {
  const params = await props.params;
  const accessToken = req.cookies.get('access_token');

  const response = await fetch(`${BASE_URL}users/${params.id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    return NextResponse.json(errorData, { status: response.status });
  }

  return NextResponse.json({ detail: "User deleted." }, { status: 200 });
}
