import { NextResponse } from 'next/server';

const DJANGO_API_URL = 'http://127.0.0.1:8000/api/doi-info/';

export async function POST(req: Request) {
    try {
        const { doi } = await req.json();
        if (!doi) {
            return NextResponse.json({ error: 'DOI is required' }, { status: 400 });
        }

        const response = await fetch(DJANGO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doi }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error fetching DOI metadata:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
