import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, year, month, bestExperienceId, worstExperienceId } = await req.json();

  if (!groupId || !year || !month || !bestExperienceId || !worstExperienceId) {
    return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
  }

  if (bestExperienceId === worstExperienceId) {
    return NextResponse.json({ error: "최고와 최악 경험은 다르게 선택해주세요." }, { status: 400 });
  }

  // 두 경험이 모두 해당 월 내 본인 경험인지 확인
  const [best, worst] = await Promise.all([
    prisma.experience.findUnique({ where: { id: bestExperienceId } }),
    prisma.experience.findUnique({ where: { id: worstExperienceId } }),
  ]);

  if (!best || best.userId !== session.user.id || !worst || worst.userId !== session.user.id) {
    return NextResponse.json({ error: "유효하지 않은 경험입니다." }, { status: 400 });
  }

  const hallOfFame = await prisma.hallOfFame.upsert({
    where: {
      userId_groupId_year_month: { userId: session.user.id, groupId, year, month },
    },
    create: {
      userId: session.user.id,
      groupId,
      year,
      month,
      bestExperienceId,
      worstExperienceId,
    },
    update: { bestExperienceId, worstExperienceId },
  });

  return NextResponse.json(hallOfFame, { status: 201 });
}
