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

  const { year, month } = getCurrentYearMonth();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const perGroupPending = await Promise.all(
    groups.map(async ({ groupId }) => {
      const [hasExperiences, existing, prevHasExperiences, prevExisting] = await Promise.all([
        prisma.experience.count({
          where: {
            userId: session.user.id,
            groupId,
            experienceDate: {
              gte: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`),
              lt: new Date(year, month, 1),
            },
          },
        }),
        prisma.hallOfFame.findUnique({
          where: { userId_groupId_year_month: { userId: session.user.id, groupId, year, month } },
        }),
        prisma.experience.count({
          where: {
            userId: session.user.id,
            groupId,
            experienceDate: {
              gte: new Date(`${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000Z`),
              lt: new Date(prevYear, prevMonth, 1),
            },
          },
        }),
        prisma.hallOfFame.findUnique({
          where: { userId_groupId_year_month: { userId: session.user.id, groupId, year: prevYear, month: prevMonth } },
        }),
      ]);

      const items: { groupId: string; year: number; month: number }[] = [];
      if (hasExperiences > 0 && !existing && lastDay) {
        items.push({ groupId, year, month });
      }
      if (prevHasExperiences > 0 && !prevExisting) {
        items.push({ groupId, year: prevYear, month: prevMonth });
      }
      return items;
    })
  );

  const pendingItems = perGroupPending.flat();

  return NextResponse.json({ pending: pendingItems.length > 0, items: pendingItems });
}
