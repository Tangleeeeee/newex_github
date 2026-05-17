import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "그룹 이름을 입력해주세요." }, { status: 400 });

  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    attempts++;
    if (attempts > 10) return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  } while (await prisma.group.findUnique({ where: { inviteCode } }));

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      inviteCode,
      createdBy: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
