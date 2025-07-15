import { NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const response = await fetch(`${BASE_URL}superuser/papers/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${authHeader}`, // Use stored token
    },
  });
  const papers = await response.json();
  console.log(papers)

  return NextResponse.json(papers);
}