import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const experience = await prisma.experience.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, username: true, profileImage: true } } },
  });

  if (!experience) return NextResponse.json({ error: "경험을 찾을 수 없습니다." }, { status: 404 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: experience.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  return NextResponse.json(experience);
}
