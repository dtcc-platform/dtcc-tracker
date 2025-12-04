import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function DELETE(request: NextRequest, props: { params: Promise<{ doi: string }> }) {
    const params = await props.params;
    const { doi } = params;
    const accessToken = request.cookies.get('access_token');
    const encodedDoi = encodeURIComponent(doi);

    try {
        const response = await fetch(`${BASE_URL}papers/delete/${encodedDoi}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to delete paper" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ doi: string }> }) {
    const params = await props.params;
    const accessToken = request.cookies.get('access_token');
    const { doi } = params;
    const encodedDoi = encodeURIComponent(doi);

    try {
        const requestData = await request.json();
        const response = await fetch(`${BASE_URL}papers/update/${encodedDoi}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 400 && errorData.error === "DOI already exists") {
                return NextResponse.json({error: "DOI already exists"}, {status: 409})
            }
            return NextResponse.json(errorData, {status: response.status});
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
