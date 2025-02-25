import { NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function DELETE(request: Request, props: { params: Promise<{ doi: string }> }) {
    const params = await props.params;
    const { doi } = params;
    const authHeader = request.headers.get("Authorization");
    const encodedDoi = encodeURIComponent(doi);

    try {
        const response = await fetch(`${BASE_URL}papers/delete/${encodedDoi}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `${authHeader}`,
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

export async function PUT(request: Request, props: { params: Promise<{ doi: string }> }) {
    const params = await props.params;
    const authHeader = request.headers.get("Authorization");
    const { doi } = params;
    console.log(`Updating Paper with DOI: ${doi}`);

    try {
        const requestData = await request.json(); // Parse request body
        const response = await fetch(`${BASE_URL}papers/update/${doi}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${authHeader}`,
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json();
              if (response.status === 400 && errorData.error === "DOI already exists") {
                  console.log('Paper exists with this doi')
                  return NextResponse.json({error: "DOI already exists"}, {status: 500})
              } else {
                  console.log("An error occurred. Please check your input.");
                  console.log(errorData)
              }
            return NextResponse.json(errorData);
          }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
