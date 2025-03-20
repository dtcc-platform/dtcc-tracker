import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const authHeader = request.headers.get("Authorization");
    const djangoRes = await fetch('http://127.0.0.1:8000/api/chat/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' ,
        "Authorization": `${authHeader}`}, 
      body: JSON.stringify({ message }),
      credentials: 'include',
    });

    if (!djangoRes.ok) {
      return NextResponse.json(
        { error: 'Error from Django' },
        { status: djangoRes.status }
      );
    }

    const data = await djangoRes.json();
    return NextResponse.json({ response: data.response });
  } catch (error) {
    console.error('Next.js API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
