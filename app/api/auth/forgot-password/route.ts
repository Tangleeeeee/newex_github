import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // 사용자 존재 여부 노출 방지
  if (!user) return NextResponse.json({ message: "재설정 링크가 이메일로 발송되었습니다." });

  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({ data: { email, token, expires } });
  await sendPasswordResetEmail(email, token);

  return NextResponse.json({ message: "재설정 링크가 이메일로 발송되었습니다." });
}
