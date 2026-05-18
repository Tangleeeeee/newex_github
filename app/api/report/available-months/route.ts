import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const experiences = await prisma.experience.findMany({
    where: { userId: session.user.id },
    select: { experienceDate: true },
    orderBy: { experienceDate: "desc" },
  });

  const monthSet = new Set<string>();
  for (const e of experiences) {
    monthSet.add(format(new Date(e.experienceDate), "yyyy-MM"));
  }

  const months = Array.from(monthSet).map((ym) => {
    const [y, m] = ym.split("-");
    return { year: parseInt(y), month: parseInt(m) };
  });

  return NextResponse.json({ months });
}
