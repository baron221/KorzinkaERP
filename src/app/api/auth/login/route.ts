import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Login va maxfiy so'zni kiriting" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ error: "Bunday foydalanuvchi topilmadi" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });
    }

    // Create session token
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const session = await encrypt({ id: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({ success: true, role: user.role }, { status: 200 });

    // Set HTTP-only cookie
    response.cookies.set({
      name: "session",
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expires,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
