import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayKST } from "@/lib/dateUtils";
import { format, eachDayOfInterval } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "groupId 필요" }, { status: 400 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한 없음" }, { status: 403 });

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, username: true, nickname: true, profileImage: true } } },
  });

  const experiences = await prisma.experience.findMany({
    where: { groupId },
    select: { userId: true, experienceDate: true },
  });

  const expSet = new Set(
    experiences.map((e) => `${e.userId}-${format(new Date(e.experienceDate), "yyyy-MM-dd")}`)
  );

  const todayStr = getTodayKST();
  const todayDate = new Date(todayStr);

  const fines = members.map((m) => {
    const joinDate = new Date(format(new Date(m.joinedAt), "yyyy-MM-dd"));
    const days = eachDayOfInterval({ start: joinDate, end: new Date(todayDate.getTime() - 86400000) });
    const missedDays = days.filter((d) => !expSet.has(`${m.userId}-${format(d, "yyyy-MM-dd")}`)).length;
    return {
      user: m.user,
      missedDays,
      fine: missedDays * 1000,
    };
  });

  fines.sort((a, b) => b.fine - a.fine);

  return NextResponse.json({ fines });
}
