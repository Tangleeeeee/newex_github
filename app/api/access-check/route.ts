import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateObject, getCurrentYearMonth, isLastDayOfMonth } from "@/lib/dateUtils";

/**
 * 미들웨어 전용 통합 엔드포인트.
 * group/my + experiences/today-status + hall-of-fame/pending 세 번의 왕복을
 * 한 번으로 합치고, 내부 쿼리를 병렬화한다.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
    orderBy: { joinedAt: "asc" },
  });
  const groupIds = memberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    return NextResponse.json({ hasGroup: false, hasRegisteredToday: false, pending: false });
  }

  const firstGroupId = groupIds[0];
  const today = getTodayDateObject();
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const lastDay = isLastDayOfMonth(kstNow);
  const { year, month } = getCurrentYearMonth();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [todayExperience, perGroupPending] = await Promise.all([
    prisma.experience.findFirst({
      where: { userId, groupId: firstGroupId, experienceDate: today },
      select: { id: true },
    }),
    Promise.all(
      groupIds.map(async (groupId) => {
        const [hasExperiences, existing, prevHasExperiences, prevExisting] = await Promise.all([
          prisma.experience.count({
            where: {
              userId,
              groupId,
              experienceDate: {
                gte: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`),
                lt: new Date(year, month, 1),
              },
            },
          }),
          prisma.hallOfFame.findUnique({
            where: { userId_groupId_year_month: { userId, groupId, year, month } },
          }),
          prisma.experience.count({
            where: {
              userId,
              groupId,
              experienceDate: {
                gte: new Date(`${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000Z`),
                lt: new Date(prevYear, prevMonth, 1),
              },
            },
          }),
          prisma.hallOfFame.findUnique({
            where: { userId_groupId_year_month: { userId, groupId, year: prevYear, month: prevMonth } },
          }),
        ]);

        const curPending = hasExperiences > 0 && !existing && lastDay;
        const prevPending = prevHasExperiences > 0 && !prevExisting;
        return curPending || prevPending;
      })
    ),
  ]);

  return NextResponse.json({
    hasGroup: true,
    hasRegisteredToday: !!todayExperience,
    pending: perGroupPending.some(Boolean),
  });
}
