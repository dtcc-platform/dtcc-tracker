import { NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

interface Params {
  params: { id: string };
}

// GET single user
export async function GET(req: Request, { params }: Params) {
  const authHeader = req.headers.get("Authorization") || "";

  const response = await fetch(`${BASE_URL}users/${params.id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// PATCH single user (partial update)
export async function PATCH(req: Request, { params }: Params) {
  const authHeader = req.headers.get("Authorization") || "";
  const body = await req.json();

  const response = await fetch(`${BASE_URL}users/${params.id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// DELETE single user
export async function DELETE(req: Request, { params }: Params) {
  const authHeader = req.headers.get("Authorization") || "";

  const response = await fetch(`${BASE_URL}users/${params.id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    return NextResponse.json(errorData, { status: response.status });
  }

  // Return some success message or just a 204
  return NextResponse.json({ detail: "User deleted." }, { status: 200 });
}
