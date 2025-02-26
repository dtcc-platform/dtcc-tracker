import { NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const response = await fetch(`${BASE_URL}papers/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${authHeader}`, // Use stored token
    },
  });
  const papers = await response.json();
  return NextResponse.json(papers);
}

// Handle POST requests
export async function POST(request: Request) {
  const body = await request.json();
  const authHeader = request.headers.get("Authorization");

  const response = await fetch(`${BASE_URL}papers/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', "Authorization": `${authHeader}` },
    body: JSON.stringify(body),
  });
  console.log(JSON.stringify(body))
  if (!response.ok) {
    const errorData = await response.json();
      if (response.status === 400 && errorData.error === "Duplicate key error") {
          console.log('Paper exists with this doi')
          return NextResponse.json({error: "DOI already exists"}, {status: 500})
      } else {
          console.log("An error occurred. Please check your input.");
          console.log(errorData)
      }
    return NextResponse.json(errorData);
  }

  const createdPaper = await response.json();
  return NextResponse.json(createdPaper, { status: 201 });
}

