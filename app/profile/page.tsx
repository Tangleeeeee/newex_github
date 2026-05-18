"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ExperienceCard from "@/components/ExperienceCard";
import { format, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

interface CalendarDay { date: string; hasExperience: boolean; isPast: boolean; }
interface Experience { id: string; title: string; review: string; rating: number; category: string; photoUrl?: string | null; experienceDate: string; }

const RATING_BANDS = [5, 4, 3, 2, 1];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [ratingBand, setRatingBand] = useState(5);
  const [ratingExps, setRatingExps] = useState<Experience[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [monthExperiences, setMonthExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    fetch(`/api/profile/${session.user.id}?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setCalendar(d.calendar ?? []);
        setTotalCount(d.totalCount ?? 0);
        setStreak(d.streak ?? 0);
        setMonthExperiences(d.experiences ?? []);
      });
  }, [session, currentDate]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/profile/${session.user.id}/by-rating?band=${ratingBand}`)
      .then((r) => r.json())
      .then(setRatingExps);
  }, [session, ratingBand]);

  function handleDayClick(day: CalendarDay) {
    if (!day.hasExperience) return;
    const exp = monthExperiences.find((e) => format(new Date(e.experienceDate), "yyyy-MM-dd") === day.date);
    if (exp) { setSelectedDate(day.date); setSelectedExp(exp); }
  }

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-lg mx-auto px-4 pb-mobile">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-700">
              {(session?.user?.nickname || session?.user?.username)?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy">
                {session?.user?.nickname || session?.user?.username}
              </h1>
              {session?.user?.nickname && (
                <p className="text-xs text-gray-400">@{session?.user?.username}</p>
              )}
              <p className="text-sm text-gray-400">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-navy">{totalCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">총 기록</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-navy">{streak}🔥</p>
              <p className="text-xs text-gray-400 mt-0.5">연속 기록</p>
            </div>
          </div>
        </div>

        {/* 캘린더 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">‹</button>
            <h2 className="font-semibold text-navy">{format(currentDate, "yyyy년 M월", { locale: ko })}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["일","월","화","수","목","금","토"].map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
            {calendar.map((day) => {
              const dayNum = parseInt(day.date.split("-")[2]);
              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day)}
                  disabled={!day.hasExperience}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                    day.hasExperience ? "cursor-pointer hover:bg-amber-50" : ""
                  }`}
                >
                  <span className={`text-xs font-medium ${day.isPast && !day.hasExperience ? "text-red-300" : "text-gray-700"}`}>
                    {dayNum}
                  </span>
                  {day.hasExperience && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-0.5" />}
                  {day.isPast && !day.hasExperience && <span className="w-1.5 h-1.5 rounded-full bg-red-300 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 별점대별 기록 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-navy mb-4">별점대별 기록</h2>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {RATING_BANDS.map((b) => (
              <button
                key={b}
                onClick={() => setRatingBand(b)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  ratingBand === b ? "bg-navy text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                ⭐ {b}점대
              </button>
            ))}
          </div>
          {ratingExps.length > 0 ? (
            <div className="space-y-3">
              {ratingExps.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} showUser={false} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-6">{ratingBand}점대 경험이 없어요</p>
          )}
        </div>
      </div>

      {/* 경험 상세 모달 */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedExp(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-400">
                {selectedDate && format(new Date(selectedDate), "yyyy년 M월 d일", { locale: ko })}
              </p>
              <button onClick={() => setSelectedExp(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <ExperienceCard experience={selectedExp} showUser={false} />
          </div>
        </div>
      )}
    </div>
  );
}
