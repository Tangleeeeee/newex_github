import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayKST } from "@/lib/dateUtils";
import { format, eachDayOfInterval, max } from "date-fns";

const FINE_START_DATE = new Date("2026-05-18T00:00:00.000Z");
// 버그로 인해 경험 입력 불가했던 날짜 (벌금 면제)
const GRACE_DAYS = new Set(["2026-05-30"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "groupId 필요" }, { status: 400 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한 없음" }, { status: 403 });

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, username: true, nickname: true, profileImage: true } } },
  });

  const experiences = await prisma.experience.findMany({
    where: { groupId },
    select: { userId: true, experienceDate: true },
  });

  const expSet = new Set(
    experiences.map((e) => `${e.userId}-${format(new Date(e.experienceDate), "yyyy-MM-dd")}`)
  );

  // KST 02:00 기준으로 "오늘" 계산 → 어제까지만 벌금 적용
  const todayStr = getTodayKST();
  const todayDate = new Date(todayStr + "T00:00:00.000Z");
  const yesterdayDate = new Date(todayDate.getTime() - 86400000);

  // 어제가 시작일보다 이전이면 아직 벌금 없음
  if (yesterdayDate < FINE_START_DATE) {
    const zeroFines = members.map((m) => ({
      user: m.user,
      missedDays: 0,
      fine: 0,
    }));
    return NextResponse.json({ fines: zeroFines });
  }

  const fines = members.map((m) => {
    const joinDate = new Date(format(new Date(m.joinedAt), "yyyy-MM-dd") + "T00:00:00.000Z");
    const startDate = max([joinDate, FINE_START_DATE]);

    if (startDate > yesterdayDate) {
      return { user: m.user, missedDays: 0, fine: 0 };
    }

    const days = eachDayOfInterval({ start: startDate, end: yesterdayDate });
    const missedDays = days.filter((d) => {
      const ds = format(d, "yyyy-MM-dd");
      return !expSet.has(`${m.userId}-${ds}`) && !GRACE_DAYS.has(ds);
    }).length;

    return {
      user: m.user,
      missedDays,
      fine: missedDays * 1000,
    };
  });

  fines.sort((a, b) => b.fine - a.fine);

  return NextResponse.json({ fines });
}
