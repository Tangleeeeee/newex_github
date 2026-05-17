"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function GroupCreatePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ name: string; inviteCode: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/group/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setCreated({ name: data.name, inviteCode: data.inviteCode });
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-md mx-auto px-4 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy">그룹 만들기</h1>
          <p className="text-sm text-gray-400 mt-1">친구들과 함께할 그룹을 만들어요</p>
        </div>

        {created ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center animate-slide-up">
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="text-xl font-bold text-navy mb-1">{created.name}</h2>
            <p className="text-sm text-gray-400 mb-5">그룹이 생성되었어요!</p>
            <div className="bg-navy rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-1">초대 코드</p>
              <p className="font-display text-3xl font-bold text-white tracking-widest">{created.inviteCode}</p>
            </div>
            <p className="text-xs text-gray-400 mb-6">이 코드를 친구들에게 공유해서 그룹에 초대하세요</p>
            <button onClick={() => router.push("/feed")} className="btn-primary w-full">피드로 이동</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">그룹 이름</label>
              <input name="name" type="text" required placeholder="예: 우리 팀 경험 기록" maxLength={30} className="input-field" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "생성 중..." : "그룹 만들기"}
            </button>
            <button type="button" onClick={() => router.push("/group/join")} className="w-full text-sm text-gray-400 hover:text-gray-600 text-center py-2">
              초대 코드로 참여하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
