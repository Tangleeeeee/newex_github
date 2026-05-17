import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) return NextResponse.json({ error: "초대 코드를 입력해주세요." }, { status: 400 });

  const group = await prisma.group.findUnique({ where: { inviteCode: inviteCode.trim().toUpperCase() } });
  if (!group) return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "이미 해당 그룹에 참여 중입니다." }, { status: 400 });

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: session.user.id, role: "MEMBER" },
  });

  return NextResponse.json(group, { status: 201 });
}
