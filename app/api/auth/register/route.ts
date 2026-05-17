import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { username, nickname, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (exists) {
    return NextResponse.json(
      { error: exists.email === email ? "이미 사용 중인 이메일입니다." : "이미 사용 중인 아이디입니다." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, nickname: nickname?.trim() || null, email, passwordHash },
  });

  return NextResponse.json({ id: user.id, username: user.username, email: user.email }, { status: 201 });
}
