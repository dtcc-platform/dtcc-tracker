import { error } from 'console';
import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('http://127.0.0.1:8000/api/papers/');
  const papers = await response.json();
  return NextResponse.json(papers);
}

// Handle POST requests
export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch('http://127.0.0.1:8000/api/papers/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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

