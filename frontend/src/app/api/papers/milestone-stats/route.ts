import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token');

  const response = await fetch(`${BASE_URL}papers/milestone-stats/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    return NextResponse.json(errorData, { status: response.status });
  }

  const stats = await response.json();
  return NextResponse.json(stats);
}
