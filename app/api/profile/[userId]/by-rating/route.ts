import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ratingBand = parseInt(searchParams.get("band") ?? "5");

  const experiences = await prisma.experience.findMany({
    where: {
      userId: params.userId,
      rating: { gte: ratingBand, lt: ratingBand + 1 },
    },
    orderBy: { experienceDate: "desc" },
  });

  return NextResponse.json(experiences);
}
