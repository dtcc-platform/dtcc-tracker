import { NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const authHeader = request.headers.get("Authorization");
    const { id } = params;
    console.log(`Updating Paper with DOI: ${id}`);

    try {
        const requestData = await request.json(); 
        console.log(requestData)
        const response = await fetch(`${BASE_URL}superuser/papers/${id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${authHeader}`,
            },
            body: JSON.stringify({"submission_year": requestData}),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}