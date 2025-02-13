import { NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';
export async function GET() {
  const response = await fetch(`${BASE_URL}projects/`);
  const papers = await response.json();
  return NextResponse.json(papers);
}

// Handle POST requests
export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${BASE_URL}projects/`, {
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

