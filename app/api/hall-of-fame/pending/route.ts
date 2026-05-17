import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentYearMonth, isLastDayOfMonth } from "@/lib/dateUtils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const lastDay = isLastDayOfMonth(kstNow);

  // 현재 달 또는 이전 달 중 아직 명예의 전당 미선택인 달 찾기
  const groups = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    select: { groupId: true },
  });

  const pendingItems: { groupId: string; year: number; month: number }[] = [];

  for (const { groupId } of groups) {
    const { year, month } = getCurrentYearMonth();

    // 이번 달 등록한 경험이 있고, 명예의 전당 미선택이면
    const hasExperiences = await prisma.experience.count({
      where: {
        userId: session.user.id,
        groupId,
        experienceDate: {
          gte: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`),
          lt: new Date(year, month, 1),
        },
      },
    });

    if (hasExperiences > 0) {
      const existing = await prisma.hallOfFame.findUnique({
        where: { userId_groupId_year_month: { userId: session.user.id, groupId, year, month } },
      });
      if (!existing && lastDay) {
        pendingItems.push({ groupId, year, month });
      }
    }

    // 이전 달 미선택 확인 (로그인 안 했다가 다음달에 로그인하는 경우)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevExisting = await prisma.hallOfFame.findUnique({
      where: { userId_groupId_year_month: { userId: session.user.id, groupId, year: prevYear, month: prevMonth } },
    });
    if (!prevExisting) {
      const prevHasExperiences = await prisma.experience.count({
        where: {
          userId: session.user.id,
          groupId,
          experienceDate: {
            gte: new Date(`${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000Z`),
            lt: new Date(prevYear, prevMonth, 1),
          },
        },
      });
      if (prevHasExperiences > 0) {
        pendingItems.push({ groupId, year: prevYear, month: prevMonth });
      }
    }
  }

  return NextResponse.json({ pending: pendingItems.length > 0, items: pendingItems });
}
