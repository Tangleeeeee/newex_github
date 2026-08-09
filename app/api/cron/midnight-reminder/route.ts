import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDateObject } from "@/lib/dateUtils";
import { sendPushToUser } from "@/lib/push";

// Vercel Cron이 매일 00:00 KST(UTC 15:00)에 호출한다. vercel.json 참고.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayDateObject();

  const users = await prisma.user.findMany({
    select: { id: true },
    where: { pushSubscriptions: { some: {} } },
  });

  let notified = 0;
  await Promise.all(
    users.map(async (user) => {
      const hasExperience = await prisma.experience.findFirst({
        where: { userId: user.id, experienceDate: today },
        select: { id: true },
      });
      if (hasExperience) return;

      await sendPushToUser(user.id, {
        title: "오늘의 경험을 아직 기록하지 않으셨어요",
        body: "잠들기 전에 오늘 하루의 새로운 경험을 남겨보세요.",
        url: "/write",
      });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
