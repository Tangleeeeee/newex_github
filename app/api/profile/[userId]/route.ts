import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthDays, format } from "@/lib/dateUtils";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, username: true, profileImage: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

  const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
  const endDate = new Date(year, month, 1);

  const experiences = await prisma.experience.findMany({
    where: {
      userId: params.userId,
      experienceDate: { gte: startDate, lt: endDate },
    },
    orderBy: { experienceDate: "asc" },
  });

  const allExperiences = await prisma.experience.findMany({
    where: { userId: params.userId },
    orderBy: { experienceDate: "asc" },
    select: { experienceDate: true },
  });

  const totalCount = allExperiences.length;
  const registeredDates = new Set(experiences.map((e) => format(e.experienceDate, "yyyy-MM-dd")));
  const monthDays = getMonthDays(year, month);
  const today = format(new Date(), "yyyy-MM-dd");

  const calendar = monthDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const isPast = dateStr < today;
    const isToday = dateStr === today;
    return {
      date: dateStr,
      hasExperience: registeredDates.has(dateStr),
      isPast: isPast && !isToday,
    };
  });

  // 연속 스트릭 계산
  let streak = 0;
  const sortedDates = allExperiences.map((e) => format(e.experienceDate, "yyyy-MM-dd")).reverse();
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = format(
      new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd"
    );
    if (sortedDates[i] === expected) streak++;
    else break;
  }

  return NextResponse.json({ user, totalCount, streak, calendar, experiences });
}
