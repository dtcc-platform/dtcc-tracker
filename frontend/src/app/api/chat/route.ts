import { NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';
export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const authHeader = request.headers.get("Authorization");
    const djangoRes = await fetch(`${BASE_URL}chat/`, {
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
    return NextResponse.json({ response: data.response, refresh: (data.action === "register_project" || data.action === "register_paper") });
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const djangoRes = await fetch(`${BASE_URL}chat/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json' ,
        "Authorization": `${authHeader}`},
      credentials: 'include',
    });

    if (!djangoRes.ok) {
      return NextResponse.json(
        { error: 'Failed to delete chat history' },
        { status: djangoRes.status }
      );
    }

    return NextResponse.json({ message: 'Chat history deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}