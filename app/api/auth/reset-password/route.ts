import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "링크가 만료되었거나 유효하지 않습니다." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email: record.email }, data: { passwordHash } });
  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ message: "비밀번호가 재설정되었습니다." });
}
