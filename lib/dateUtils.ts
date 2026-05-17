import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const KST = "Asia/Seoul";

export function getNowKST(): Date {
  return toZonedTime(new Date(), KST);
}

/** 경험 등록 시각 기준으로 experienceDate 계산 (00:00~01:59 → 전날, 02:00~ → 당일) */
export function getExperienceDate(now?: Date): Date {
  const kst = toZonedTime(now ?? new Date(), KST);
  const hour = kst.getHours();
  if (hour < 2) {
    const prev = subDays(kst, 1);
    return new Date(format(prev, "yyyy-MM-dd") + "T00:00:00.000Z");
  }
  return new Date(format(kst, "yyyy-MM-dd") + "T00:00:00.000Z");
}

/** 현재 KST 날짜 문자열 (yyyy-MM-dd) */
export function getTodayKST(now?: Date): string {
  const kst = toZonedTime(now ?? new Date(), KST);
  const hour = kst.getHours();
  if (hour < 2) {
    return format(subDays(kst, 1), "yyyy-MM-dd");
  }
  return format(kst, "yyyy-MM-dd");
}

/** 오늘(KST 기준) experienceDate 범위 (Date 객체) */
export function getTodayDateObject(): Date {
  return new Date(getTodayKST() + "T00:00:00.000Z");
}

/** 월간 리포트용: 해당 월의 일수 및 빠진 날 계산 */
export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

/** 현재 달의 말일인지 확인 (KST 기준) */
export function isLastDayOfMonth(now?: Date): boolean {
  const kst = toZonedTime(now ?? new Date(), KST);
  const end = endOfMonth(kst);
  return format(kst, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
}

/** 현재 연도/월 (KST) */
export function getCurrentYearMonth(): { year: number; month: number } {
  const kst = toZonedTime(new Date(), KST);
  return { year: kst.getFullYear(), month: kst.getMonth() + 1 };
}

export { format, KST };
