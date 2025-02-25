import { NextResponse } from "next/server";
import { BASE_URL } from "@/app/types/FixedTypes";

export async function DELETE(request: Request, props: { params: Promise<{ projectName: string }> }) {
    const params = await props.params;
    const authHeader = request.headers.get("Authorization");
    const { projectName} = params;
    console.log(projectName)

    try {
        const response = await fetch(`${BASE_URL}projects/delete/${projectName}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `${authHeader}`,
            },
        });
  
        if (!response.ok) {
            return NextResponse.json({ error: "Failed to delete project" }, { status: response.status });
        }
  
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ projectName: string }> }) {
    const params = await props.params;
    const authHeader = request.headers.get("Authorization");
    const { projectName } = params;
    console.log(`Updating Project with Name: ${projectName}`);

    try {
        const requestData = await request.json(); // Parse request body
        const response = await fetch(`${BASE_URL}projects/update/${projectName}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${authHeader}`,
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json();
              if (response.status === 400 && errorData.error === "Project already exists") {
                  console.log('Paper exists with this doi')
                  return NextResponse.json({error: "Project already exists"}, {status: 500})
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
