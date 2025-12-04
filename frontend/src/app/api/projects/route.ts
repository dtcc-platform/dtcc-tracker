import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token');
  const response = await fetch(`${BASE_URL}projects/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
  });
  const projects = await response.json();
  return NextResponse.json(projects, { status: response.status });
}

// Handle POST requests
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  const body = await request.json();
  const response = await fetch(`${BASE_URL}projects/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 400 && errorData.error === "Duplicate key error") {
      return NextResponse.json({error: "Project already exists"}, {status: 500})
    }
    return NextResponse.json(errorData, { status: response.status });
  }

  const createdProject = await response.json();
  return NextResponse.json(createdProject, { status: 201 });
}

