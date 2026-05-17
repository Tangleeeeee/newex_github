"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ExperienceCard from "@/components/ExperienceCard";

interface Experience {
  id: string;
  title: string;
  review: string;
  rating: number;
  category: string;
  photoUrl?: string | null;
  experienceDate: string;
}

export default function HallOfFameSelectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingItems, setPendingItems] = useState<{ groupId: string; year: number; month: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bestId, setBestId] = useState<string | null>(null);
  const [worstId, setWorstId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/hall-of-fame/pending")
      .then((r) => r.json())
      .then((d) => {
        if (!d.pending || !d.items?.length) { router.push("/feed"); return; }
        setPendingItems(d.items);
      });
  }, [router]);

  useEffect(() => {
    if (!pendingItems[currentIndex] || !session?.user?.id) return;
    const { year, month, groupId } = pendingItems[currentIndex];
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    fetch(`/api/experiences?groupId=${groupId}`)
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.experiences ?? []).filter(
          (e: Experience) => {
            const d = new Date(e.experienceDate);
            return d.getFullYear() === year && d.getMonth() + 1 === month;
          }
        );
        setExperiences(filtered);
      });
  }, [pendingItems, currentIndex, session]);

  async function handleSubmit() {
    if (!bestId || !worstId) return;
    setLoading(true);
    const { groupId, year, month } = pendingItems[currentIndex];
    await fetch("/api/hall-of-fame/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, year, month, bestExperienceId: bestId, worstExperienceId: worstId }),
    });
    setLoading(false);
    if (currentIndex < pendingItems.length - 1) {
      setCurrentIndex((i) => i + 1);
      setBestId(null); setWorstId(null);
    } else {
      const { year, month } = pendingItems[currentIndex];
      router.push(`/report/monthly/${year}/${month}`);
    }
  }

  if (!pendingItems.length) return null;
  const current = pendingItems[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-offwhite overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-2">Hall of Fame</p>
          <h1 className="font-display text-3xl font-bold text-navy">
            {current.year}년 {current.month}월<br />명예의 전당 선택
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            이 달의 최고와 최악의 경험을 선택해주세요
          </p>
        </div>

        {/* 최고의 경험 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏆</span>
            <h2 className="font-semibold text-navy">최고의 경험</h2>
            {bestId && <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">선택됨</span>}
          </div>
          <div className="space-y-2">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                onClick={() => setBestId(exp.id === bestId ? null : exp.id)}
                className={`cursor-pointer rounded-2xl border-2 transition-all ${
                  bestId === exp.id ? "border-green-400 shadow-md" : "border-transparent"
                }`}
              >
                <ExperienceCard experience={exp} showUser={false} />
              </div>
            ))}
          </div>
        </div>

        {/* 최악의 경험 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">😓</span>
            <h2 className="font-semibold text-navy">최악의 경험</h2>
            {worstId && <span className="ml-auto text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">선택됨</span>}
          </div>
          <div className="space-y-2">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                onClick={() => setWorstId(exp.id === worstId ? null : exp.id)}
                className={`cursor-pointer rounded-2xl border-2 transition-all ${
                  worstId === exp.id ? "border-red-400 shadow-md" : "border-transparent"
                }`}
              >
                <ExperienceCard experience={exp} showUser={false} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!bestId || !worstId || bestId === worstId || loading}
          className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "저장 중..." : "확인"}
        </button>
        {bestId === worstId && bestId !== null && (
          <p className="text-center text-red-500 text-sm mt-2">최고와 최악은 다르게 선택해주세요</p>
        )}
      </div>
    </div>
  );
}
