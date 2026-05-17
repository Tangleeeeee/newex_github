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

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const hallOfFames = await prisma.hallOfFame.findMany({
    where: { groupId: params.groupId, year, month },
    include: {
      user: { select: { id: true, username: true, profileImage: true } },
      bestExperience: true,
      worstExperience: true,
    },
  });

  return NextResponse.json(hallOfFames);
}
