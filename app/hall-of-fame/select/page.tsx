"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ExperienceCard from "@/components/ExperienceCard";
import StarRating from "@/components/StarRating";

interface Experience {
  id: string;
  title: string;
  review: string;
  rating: number;
  category: string;
  photoUrl?: string | null;
  experienceDate: string;
  user?: { id: string; username: string; nickname?: string | null };
}

const RATING_BANDS = [5, 4, 3, 2, 1];

function HallOfFameSelectContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<{ groupId: string; year: number; month: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bestId, setBestId] = useState<string | null>(null);
  const [worstId, setWorstId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/hall-of-fame/pending")
      .then((r) => r.json())
      .then((d) => {
        if (!d.pending || !d.items?.length) { router.push("/write"); return; }
        setPendingItems(d.items);
      });
  }, [router]);

  useEffect(() => {
    if (!pendingItems[currentIndex] || !session?.user?.id) return;
    const { year, month, groupId } = pendingItems[currentIndex];
    fetch(`/api/experiences?groupId=${groupId}`)
      .then((r) => r.json())
      .then((d) => {
        // 내 경험만, 해당 월만 필터링
        const filtered = (d.experiences ?? []).filter((e: Experience) => {
          const date = new Date(e.experienceDate);
          return (
            e.user?.id === session.user?.id &&
            date.getFullYear() === year &&
            date.getMonth() + 1 === month
          );
        });
        // 별점 내림차순 정렬
        filtered.sort((a: Experience, b: Experience) => b.rating - a.rating);
        setExperiences(filtered);
        setRatingFilter(null);
        setBestId(null);
        setWorstId(null);
      });
  }, [pendingItems, currentIndex, session]);

  async function handleSubmit() {
    if (!bestId || !worstId) return;
    setLoading(true);
    const { groupId, year, month } = pendingItems[currentIndex];
    const res = await fetch("/api/hall-of-fame/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, year, month, bestExperienceId: bestId, worstExperienceId: worstId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "오류가 발생했습니다.");
      return;
    }
    if (currentIndex < pendingItems.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const { year, month } = pendingItems[currentIndex];
      router.push(`/report/monthly/${year}/${month}`);
    }
  }

  const filteredExps = ratingFilter !== null
    ? experiences.filter((e) => Math.floor(e.rating) === ratingFilter || (ratingFilter === 5 && e.rating === 5))
    : experiences;

  // 각 별점대에 경험이 있는지 확인
  const bandCounts = RATING_BANDS.reduce((acc, b) => {
    acc[b] = experiences.filter((e) => e.rating >= b && e.rating < b + 1).length;
    if (b === 5) acc[b] = experiences.filter((e) => e.rating === 5).length;
    return acc;
  }, {} as Record<number, number>);

  if (!pendingItems.length) return null;
  const current = pendingItems[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-offwhite overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-2">Hall of Fame</p>
          <h1 className="font-display text-3xl font-bold text-navy">
            {current.year}년 {current.month}월<br />명예의 전당 선택
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            이 달의 최고와 최악의 경험을 선택해주세요
          </p>
          {pendingItems.length > 1 && (
            <p className="text-xs text-amber-500 mt-1">{currentIndex + 1} / {pendingItems.length}</p>
          )}
        </div>

        {/* 선택 상태 */}
        <div className="flex gap-3 mb-5">
          <div className={`flex-1 rounded-xl p-3 text-center text-sm border-2 transition-all ${bestId ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}>
            <p className="text-xs text-gray-400 mb-1">🏆 최고</p>
            <p className="font-medium text-gray-700 text-xs truncate">
              {bestId ? (experiences.find(e => e.id === bestId)?.title ?? "선택됨") : "미선택"}
            </p>
          </div>
          <div className={`flex-1 rounded-xl p-3 text-center text-sm border-2 transition-all ${worstId ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}>
            <p className="text-xs text-gray-400 mb-1">😓 최악</p>
            <p className="font-medium text-gray-700 text-xs truncate">
              {worstId ? (experiences.find(e => e.id === worstId)?.title ?? "선택됨") : "미선택"}
            </p>
          </div>
        </div>

        {/* 별점 필터 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setRatingFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${ratingFilter === null ? "bg-navy text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            전체 ({experiences.length})
          </button>
          {RATING_BANDS.filter(b => bandCounts[b] > 0).map((b) => (
            <button
              key={b}
              onClick={() => setRatingFilter(b)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${ratingFilter === b ? "bg-navy text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              ⭐{b}점대 ({bandCounts[b]})
            </button>
          ))}
        </div>

        {/* 경험 목록 */}
        {filteredExps.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            {experiences.length === 0 ? "이 달 등록한 경험이 없어요" : "해당 별점대 경험이 없어요"}
          </p>
        ) : (
          <div className="space-y-3 mb-6">
            {filteredExps.map((exp) => {
              const isBest = bestId === exp.id;
              const isWorst = worstId === exp.id;
              return (
                <div key={exp.id} className="relative">
                  {/* 별점 표시 */}
                  <div className="absolute top-3 left-3 z-10">
                    <StarRating value={exp.rating} readonly size="sm" />
                  </div>
                  {/* 선택 뱃지 */}
                  {isBest && <span className="absolute top-3 right-3 z-10 text-xs bg-green-400 text-white font-bold px-2 py-0.5 rounded-full">🏆 최고</span>}
                  {isWorst && <span className="absolute top-3 right-3 z-10 text-xs bg-red-400 text-white font-bold px-2 py-0.5 rounded-full">😓 최악</span>}

                  {/* 최고 선택 */}
                  <div
                    onClick={() => setBestId(isBest ? null : exp.id)}
                    className={`cursor-pointer rounded-2xl border-2 transition-all ${isBest ? "border-green-400 shadow-md" : "border-transparent"}`}
                  >
                    <ExperienceCard experience={exp} showUser={false} />
                  </div>

                  {/* 최악 선택 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setWorstId(isWorst ? null : exp.id); }}
                    className={`mt-1 w-full text-xs py-1.5 rounded-xl border transition-all font-medium ${
                      isWorst ? "border-red-400 bg-red-50 text-red-600" : "border-gray-200 bg-white text-gray-400 hover:border-red-300 hover:text-red-400"
                    }`}
                  >
                    {isWorst ? "😓 최악으로 선택됨 (취소)" : "😓 최악으로 선택"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="sticky bottom-4">
          <button
            onClick={handleSubmit}
            disabled={!bestId || !worstId || bestId === worstId || loading}
            className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "저장 중..." : "확인"}
          </button>
          {bestId === worstId && bestId !== null && (
            <p className="text-center text-red-500 text-sm mt-2">최고와 최악은 다르게 선택해주세요</p>
          )}
          <p className="text-center text-xs text-gray-400 mt-2">카드 클릭 = 최고 선택 / 하단 버튼 = 최악 선택</p>
        </div>
      </div>
    </div>
  );
}

export default function HallOfFameSelectPage() {
  return (
    <Suspense>
      <HallOfFameSelectContent />
    </Suspense>
  );
}
