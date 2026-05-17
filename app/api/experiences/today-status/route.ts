import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateObject } from "@/lib/dateUtils";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "groupId 필요" }, { status: 400 });

  const today = getTodayDateObject();

  const [myExperience, members, memberExperiences] = await Promise.all([
    prisma.experience.findFirst({
      where: { userId: session.user.id, groupId, experienceDate: today },
    }),
    prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.experience.findMany({
      where: { groupId, experienceDate: today },
      select: { userId: true },
    }),
  ]);

  const registeredUserIds = new Set(memberExperiences.map((e) => e.userId));
  const totalMembers = members.length;
  const registeredCount = registeredUserIds.size;

  return NextResponse.json({
    hasRegisteredToday: !!myExperience,
    totalMembers,
    registeredCount,
    members: members.map((m) => ({
      ...m.user,
      hasRegistered: registeredUserIds.has(m.userId),
    })),
  });
}
