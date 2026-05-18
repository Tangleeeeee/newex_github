"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ExperienceCard from "@/components/ExperienceCard";

interface HallOfFameEntry {
  id: string;
  year: number;
  month: number;
  bestExperience: { id: string; title: string; review: string; rating: number; category: string; photoUrl?: string | null; experienceDate: string; };
  worstExperience: { id: string; title: string; review: string; rating: number; category: string; photoUrl?: string | null; experienceDate: string; };
  user?: { id: string; username: string; profileImage?: string | null };
}

export default function HallOfFamePage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"personal" | "group">("personal");
  const [groupId, setGroupId] = useState("");
  const [, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [personalEntries, setPersonalEntries] = useState<HallOfFameEntry[]>([]);
  const [groupEntries, setGroupEntries] = useState<HallOfFameEntry[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetch("/api/group/my").then((r) => r.json()).then((d) => {
      if (d.groups?.length) { setGroups(d.groups); setGroupId(d.groups[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/hall-of-fame/${session.user.id}${groupId ? `?groupId=${groupId}` : ""}`)
      .then((r) => r.json()).then(setPersonalEntries);
  }, [session, groupId]);

  useEffect(() => {
    if (!groupId || tab !== "group") return;
    fetch(`/api/hall-of-fame/group/${groupId}?year=${year}&month=${month}`)
      .then((r) => r.json()).then(setGroupEntries);
  }, [groupId, tab, year, month]);

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-mobile">
        <div className="mb-6">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-1">Hall of Fame</p>
          <h1 className="font-display text-3xl font-bold text-navy">명예의 전당</h1>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-6 max-w-xs">
          {(["personal", "group"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-white text-navy shadow-sm" : "text-gray-500"}`}>
              {t === "personal" ? "내 기록" : "그룹 비교"}
            </button>
          ))}
        </div>

        {tab === "personal" && (
          <div className="space-y-6">
            {personalEntries.length === 0 && (
              <p className="text-center text-gray-400 py-12">아직 선택된 명예의 전당이 없어요</p>
            )}
            {personalEntries.map((entry) => (
              <div key={entry.id} className="animate-slide-up">
                <h2 className="text-sm font-bold text-gray-400 mb-3">{entry.year}년 {entry.month}월</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">🏆 최고의 경험</p>
                    <ExperienceCard experience={entry.bestExperience} showUser={false} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-2">😓 최악의 경험</p>
                    <ExperienceCard experience={entry.worstExperience} showUser={false} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "group" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-28">
                {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field w-24">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            {groupEntries.length === 0 ? (
              <p className="text-center text-gray-400 py-12">이 달의 명예의 전당이 아직 없어요</p>
            ) : (
              <div className="space-y-6">
                {groupEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                        {entry.user?.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-navy">{entry.user?.username}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-2">🏆 최고</p>
                        <ExperienceCard experience={entry.bestExperience} showUser={false} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-2">😓 최악</p>
                        <ExperienceCard experience={entry.worstExperience} showUser={false} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
