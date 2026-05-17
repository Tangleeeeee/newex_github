import cron from "node-cron";
import { prisma } from "./prisma";
import { sendReminderEmail, sendMonthlyReportEmail } from "./email";
import { getTodayDateObject, isLastDayOfMonth, getCurrentYearMonth, getMonthDays, format } from "./dateUtils";

export function startCronJobs() {
  // 1. 매일 새벽 01:00 KST (UTC 16:00)
  cron.schedule("0 16 * * *", async () => {
    console.log("[CRON] Running daily reminder check...");
    const today = getTodayDateObject();

    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, username: true },
    });

    for (const user of allUsers) {
      const hasExperience = await prisma.experience.findFirst({
        where: { userId: user.id, experienceDate: today },
      });
      if (!hasExperience) {
        await sendReminderEmail(user.email, user.username).catch(console.error);
      }
    }
    console.log("[CRON] Daily reminder sent.");
  });

  // 2. 매달 말일 23:00 KST (UTC 14:00) — 마지막 날 체크
  cron.schedule("0 14 * * *", async () => {
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    if (!isLastDayOfMonth(kstNow)) return;
    console.log("[CRON] Running monthly report generation...");

    const { year, month } = getCurrentYearMonth();
    const monthDays = getMonthDays(year, month);
    const today = format(new Date(), "yyyy-MM-dd");

    const memberships = await prisma.groupMember.findMany({
      include: { user: true },
    });

    const processed = new Set<string>();
    for (const m of memberships) {
      const key = `${m.userId}-${m.groupId}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
      const endDate = new Date(year, month, 1);

      const experiences = await prisma.experience.findMany({
        where: { userId: m.userId, groupId: m.groupId, experienceDate: { gte: startDate, lt: endDate } },
      });

      const registeredDates = new Set(experiences.map((e) => format(e.experienceDate, "yyyy-MM-dd")));
      const missedDays = monthDays.filter((d) => {
        const ds = format(d, "yyyy-MM-dd");
        return ds <= today && !registeredDates.has(ds);
      }).length;

      const averageRating =
        experiences.length > 0
          ? experiences.reduce((s, e) => s + e.rating, 0) / experiences.length
          : 0;

      await prisma.monthlyReport.upsert({
        where: { userId_groupId_year_month: { userId: m.userId, groupId: m.groupId, year, month } },
        create: { userId: m.userId, groupId: m.groupId, year, month, missedDays, averageRating },
        update: { missedDays, averageRating },
      });

      await sendMonthlyReportEmail(m.user.email, m.user.username, year, month, averageRating, missedDays).catch(console.error);
    }
    console.log("[CRON] Monthly reports generated.");
  });

  // 3. 매년 12월 31일 23:30 KST (UTC 14:30)
  cron.schedule("30 14 31 12 *", async () => {
    console.log("[CRON] Running annual report generation...");
    const year = getCurrentYearMonth().year;

    const users = await prisma.user.findMany();
    for (const user of users) {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

      const experiences = await prisma.experience.findMany({
        where: { userId: user.id, experienceDate: { gte: startDate, lt: endDate } },
        orderBy: { rating: "desc" },
      });

      if (experiences.length === 0) continue;

      const best = experiences[0];
      await prisma.annualReport.upsert({
        where: { userId_year: { userId: user.id, year } },
        create: { userId: user.id, year, bestExperienceId: best.id },
        update: { bestExperienceId: best.id },
      });
    }
    console.log("[CRON] Annual reports generated.");
  });

  console.log("[CRON] All cron jobs scheduled.");
}
