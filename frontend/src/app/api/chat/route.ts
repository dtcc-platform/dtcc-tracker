import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/app/types/FixedTypes';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const accessToken = request.cookies.get('access_token');
    const djangoRes = await fetch(`${BASE_URL}chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
      },
      body: JSON.stringify({ message }),
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

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token');
    const djangoRes = await fetch(`${BASE_URL}chat/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
      },
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