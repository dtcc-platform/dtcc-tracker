import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('http://127.0.0.1:8000/api/projects/');
  const papers = await response.json();
  return NextResponse.json(papers);
}

// Handle POST requests
export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch('http://127.0.0.1:8000/api/projects/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to create paper' }, { status: 500 });
  }

  const createdPaper = await response.json();
  return NextResponse.json(createdPaper, { status: 201 });
}

