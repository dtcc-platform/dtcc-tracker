import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const accessToken = request.cookies.get('access_token');
    const { id } = params;

    try {
        const requestData = await request.json();
        const response = await fetch(`${BASE_URL}superuser/papers/${id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { "Cookie": `access_token=${accessToken.value}` } : {}),
            },
            body: JSON.stringify({"submission_year": requestData}),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}