import { NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const response = await fetch(`${BASE_URL}projects/`, {
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
  const authHeader = request.headers.get("Authorization");
  const body = await request.json();
  const response = await fetch(`${BASE_URL}projects/`, {
    method: 'POST',
    headers: { 
    'Content-Type': 'application/json',
     "Authorization": `${authHeader}`,
     },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.log(errorData)
      if (response.status === 400 && errorData.error === "Duplicate key error") {
          console.log('Project exists with this project name')
          return NextResponse.json({error: "Project already exists"}, {status: 500})
      } else {
          console.log("An error occurred. Please check your input.");
          console.log(errorData)
          return NextResponse.json({error: "An error occured"}, {status: 500})
      }
  }

  const createdPaper = await response.json();
  return NextResponse.json(createdPaper, { status: 201 });
}

