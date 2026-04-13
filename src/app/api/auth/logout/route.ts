import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  response.cookies.set({
    name: "session",
    value: "",
    expires: new Date(0), // expire immediately
    path: "/",
  });

  return response;
}
