"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ExperienceCard from "@/components/ExperienceCard";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Experience {
  id: string;
  title: string;
  review: string;
  rating: number;
  category: string;
  photoUrl?: string | null;
  experienceDate: string;
  user: { id: string; username: string; profileImage?: string | null };
}

interface Group {
  id: string;
  name: string;
  inviteCode: string;
}

export default function FeedPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasNoGroup, setHasNoGroup] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/group/my")
      .then((r) => r.json())
      .then((data) => {
        if (!data.groups?.length) { setHasNoGroup(true); return; }
        setGroups(data.groups);
        setGroupId(data.groups[0].id);
      });
  }, []);

  const loadFeed = useCallback(async (gid: string, cursor?: string) => {
    setLoading(true);
    const url = `/api/experiences?groupId=${gid}${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setLoading(false);
    if (cursor) {
      setExperiences((prev) => [...prev, ...data.experiences]);
    } else {
      setExperiences(data.experiences ?? []);
    }
    setNextCursor(data.nextCursor);
  }, []);

  useEffect(() => {
    if (groupId) loadFeed(groupId);
  }, [groupId, loadFeed]);

  const currentGroup = groups.find((g) => g.id === groupId);

  function handleCopyCode() {
    if (!currentGroup) return;
    navigator.clipboard.writeText(currentGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const grouped = experiences.reduce(
    (acc, exp) => {
      const date = format(new Date(exp.experienceDate), "yyyy년 M월 d일 EEEE", { locale: ko });
      if (!acc[date]) acc[date] = [];
      acc[date].push(exp);
      return acc;
    },
    {} as Record<string, Experience[]>
  );

  if (hasNoGroup) {
    return (
      <div className="min-h-screen bg-offwhite">
        <Navbar />
        <div className="pt-20 max-w-lg mx-auto px-4 text-center">
          <p className="text-4xl mb-4">👋</p>
          <h2 className="text-xl font-bold text-navy mb-2">그룹에 참여해보세요</h2>
          <p className="text-gray-500 text-sm mb-6">그룹을 만들거나 초대 코드로 참여하면 피드를 볼 수 있어요.</p>
          <div className="flex gap-3 justify-center">
            <a href="/group/setup" className="btn-primary">그룹 설정하기</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-lg mx-auto px-4 pb-12">

        {/* 그룹 탭 + 초대 코드 버튼 */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setGroupId(g.id); setShowInvite(false); }}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  groupId === g.id ? "bg-navy text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 transition-all"
            title="초대 코드"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
        </div>

        {/* 초대 코드 패널 */}
        {showInvite && currentGroup && (
          <div className="bg-navy rounded-2xl p-5 mb-6 animate-slide-up">
            <p className="text-xs text-gray-400 mb-1">&quot;{currentGroup.name}&quot; 초대 코드</p>
            <div className="flex items-center justify-between">
              <p className="font-display text-3xl font-bold text-white tracking-[0.2em]">
                {currentGroup.inviteCode}
              </p>
              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  copied
                    ? "bg-green-400 text-white"
                    : "bg-amber-400 text-navy hover:bg-amber-300"
                }`}
              >
                {copied ? "복사됨 ✓" : "복사"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">친구에게 이 코드를 공유하면 그룹에 참여할 수 있어요</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, exps]) => (
          <div key={date} className="mb-8 animate-fade-in">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 sticky top-14 bg-offwhite/90 backdrop-blur-sm py-1.5">
              {date}
            </h2>
            <div className="space-y-4">
              {exps.map((exp) => {
                const isToday = format(new Date(exp.experienceDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                const isMyExp = exp.user?.id === session?.user?.id;
                return (
                  <div
                    key={exp.id}
                    onClick={isToday && isMyExp ? () => router.push(`/write?edit=${exp.id}`) : undefined}
                    className={isToday && isMyExp ? "cursor-pointer relative" : ""}
                  >
                    {isToday && isMyExp && (
                      <span className="absolute top-3 right-3 z-10 text-xs bg-amber-400 text-navy font-semibold px-2 py-0.5 rounded-full">수정 가능</span>
                    )}
                    <ExperienceCard experience={exp} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {nextCursor && (
          <button
            onClick={() => loadFeed(groupId, nextCursor)}
            disabled={loading}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-4"
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        )}

        {!loading && experiences.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">✨</p>
            <p className="text-gray-400">아직 기록된 경험이 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
