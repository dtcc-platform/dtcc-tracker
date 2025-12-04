import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';

export async function GET(req: NextRequest) {
  // Get access token from cookies and forward to Django
  const accessToken = req.cookies.get('access_token');

  const response = await fetch(`${BASE_URL}papers/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
  });
  const papers = await response.json();
  return NextResponse.json(papers, { status: response.status });
}

// Handle POST requests
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Get access token from cookies and forward to Django
  const accessToken = request.cookies.get('access_token');

  const response = await fetch(`${BASE_URL}papers/`, {
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
          return NextResponse.json({error: "DOI already exists"}, {status: 500})
      }
    return NextResponse.json(errorData, { status: response.status });
  }

  const createdPaper = await response.json();
  return NextResponse.json(createdPaper, { status: 201 });
}

