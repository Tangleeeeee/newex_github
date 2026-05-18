import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthDays, format } from "@/lib/dateUtils";

export async function GET(
  req: Request,
  { params }: { params: { year: string; month: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = parseInt(params.year);
  const month = parseInt(params.month);
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId") ?? "";

  const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
  const endDate = new Date(year, month, 1);

  const experiences = await prisma.experience.findMany({
    where: {
      userId: session.user.id,
      ...(groupId ? { groupId } : {}),
      experienceDate: { gte: startDate, lt: endDate },
    },
  });

  const monthDays = getMonthDays(year, month);
  const today = format(new Date(), "yyyy-MM-dd");
  const registeredDates = new Set(experiences.map((e) => format(e.experienceDate, "yyyy-MM-dd")));
  const FINE_START = "2026-05-18";

  const missedDays = monthDays.filter((d) => {
    const ds = format(d, "yyyy-MM-dd");
    return ds <= today && ds >= FINE_START && !registeredDates.has(ds);
  }).length;

  const averageRating =
    experiences.length > 0
      ? experiences.reduce((sum, e) => sum + e.rating, 0) / experiences.length
      : 0;

  const categoryCount = experiences.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const hallOfFame = groupId
    ? await prisma.hallOfFame.findUnique({
        where: { userId_groupId_year_month: { userId: session.user.id, groupId, year, month } },
        include: { bestExperience: true, worstExperience: true },
      })
    : null;

  // 다른 달 평균 별점 (최근 12개월)
  const monthlyAvgs: { year: number; month: number; avg: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(year, month - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthStart = new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00.000Z`);
    const monthEnd = new Date(y, m, 1);
    const exps = await prisma.experience.findMany({
      where: {
        userId: session.user.id,
        ...(groupId ? { groupId } : {}),
        experienceDate: { gte: monthStart, lt: monthEnd },
      },
      select: { rating: true },
    });
    if (exps.length > 0) {
      monthlyAvgs.push({
        year: y,
        month: m,
        avg: exps.reduce((s, e) => s + e.rating, 0) / exps.length,
      });
    }
  }

  return NextResponse.json({
    year,
    month,
    experiences,
    missedDays,
    averageRating,
    categoryCount,
    hallOfFame,
    monthlyAvgs: monthlyAvgs.reverse(),
  });
}
