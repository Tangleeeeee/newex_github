import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { year: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = parseInt(params.year);
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const annualReport = await prisma.annualReport.findUnique({
    where: { userId_year: { userId: session.user.id, year } },
    include: { bestExperience: true },
  });

  const experiences = await prisma.experience.findMany({
    where: {
      userId: session.user.id,
      experienceDate: { gte: startDate, lt: endDate },
    },
    orderBy: { experienceDate: "asc" },
  });

  const monthlyHallOfFames = await prisma.hallOfFame.findMany({
    where: { userId: session.user.id, year },
    orderBy: { month: "asc" },
    include: { bestExperience: true, worstExperience: true },
  });

  const monthlyAvgs: { month: number; avg: number; count: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthStart = new Date(`${year}-${String(m).padStart(2, "0")}-01T00:00:00.000Z`);
    const monthEnd = new Date(year, m, 1);
    const exps = experiences.filter(
      (e) => e.experienceDate >= monthStart && e.experienceDate < monthEnd
    );
    monthlyAvgs.push({
      month: m,
      avg: exps.length > 0 ? exps.reduce((s, e) => s + e.rating, 0) / exps.length : 0,
      count: exps.length,
    });
  }

  const categoryCount = experiences.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    year,
    annualReport,
    experiences,
    monthlyHallOfFames,
    monthlyAvgs,
    categoryCount,
    totalCount: experiences.length,
  });
}
