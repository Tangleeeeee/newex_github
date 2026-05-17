import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  const hallOfFames = await prisma.hallOfFame.findMany({
    where: {
      userId: params.userId,
      ...(groupId ? { groupId } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      bestExperience: true,
      worstExperience: true,
    },
  });

  return NextResponse.json(hallOfFames);
}
