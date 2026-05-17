"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Navbar from "@/components/Navbar";

export default function WritePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [todayStatus, setTodayStatus] = useState<{
    hasRegisteredToday: boolean;
    totalMembers: number;
    registeredCount: number;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    setGroupsLoading(true);
    fetch("/api/group/my")
      .then((r) => r.json())
      .then((data) => {
        if (data.groups?.length > 0) {
          setGroups(data.groups);
          setGroupId(data.groups[0].id);
        } else {
          router.replace("/group/setup");
        }
      })
      .finally(() => setGroupsLoading(false));
  }, [router]);

  useEffect(() => {
    if (!groupId) return;
    fetch(`/api/experiences/today-status?groupId=${groupId}`)
      .then((r) => r.json())
      .then(setTodayStatus);
  }, [groupId]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("사진은 5MB 이하만 업로드 가능합니다.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (rating === 0) { setError("별점을 선택해주세요."); return; }
    if (!category) { setError("카테고리를 선택해주세요."); return; }
    if (!groupId) { setError("그룹을 선택해주세요."); return; }

    setLoading(true);
    const form = new FormData(e.currentTarget);
    form.set("rating", String(rating));
    form.set("category", category);
    form.set("groupId", groupId);
    if (photo) form.set("photo", photo);

    const res = await fetch("/api/experiences", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error); return; }
    router.push("/feed");
    router.refresh();
  }

  const today = format(new Date(), "yyyy년 M월 d일 EEEE", { locale: ko });

  if (groupsLoading) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  // 오늘 이미 등록한 경우
  if (todayStatus?.hasRegisteredToday) {
    return (
      <div className="min-h-screen bg-offwhite">
        <Navbar />
        <div className="pt-20 max-w-lg mx-auto px-4 text-center py-16">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-navy mb-2">오늘의 경험을 이미 등록했어요!</h2>
          <p className="text-sm text-gray-400 mb-6">내일 또 새로운 경험을 기록해보세요.</p>
          <button onClick={() => router.push("/feed")} className="btn-primary">
            피드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-20 pb-12">
        <div className="mb-8">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-1">Today</p>
          <h1 className="font-display text-3xl font-bold text-navy">{today}</h1>
          {todayStatus && (
            <p className="mt-2 text-sm text-gray-500">
              팀원 {todayStatus.totalMembers}명 중 {todayStatus.registeredCount}명 등록 완료 ✓
            </p>
          )}
        </div>

        {groups.length > 1 && (
          <div className="mb-5">
            <label className="label">그룹 선택</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="input-field"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">오늘의 경험 *</label>
            <input
              name="title"
              type="text"
              required
              placeholder="어떤 새로운 경험을 했나요?"
              className="input-field"
              maxLength={100}
            />
          </div>

          <div>
            <label className="label">별점 *</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label className="label">카테고리 *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    category === cat
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">
              한줄평 *
              <span className="text-gray-400 font-normal text-xs ml-1">최대 100자</span>
            </label>
            <textarea
              name="review"
              required
              maxLength={100}
              rows={2}
              placeholder="한 문장으로 오늘의 경험을 표현해주세요"
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="label">
              사진
              <span className="text-gray-400 font-normal text-xs ml-1">선택, 최대 5MB</span>
            </label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-sm text-gray-400">클릭해서 사진 추가</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base py-3.5"
          >
            {loading ? "등록 중..." : "경험 등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
