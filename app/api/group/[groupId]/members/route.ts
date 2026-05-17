import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  const members = await prisma.groupMember.findMany({
    where: { groupId: params.groupId },
    include: { user: { select: { id: true, username: true, profileImage: true, createdAt: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
}
