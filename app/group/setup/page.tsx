"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupSetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ name: string; inviteCode: string } | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
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

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/group/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: form.get("inviteCode") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/write");
    router.refresh();
  }

  // 그룹 생성 완료 화면
  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center animate-slide-up">
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="text-xl font-bold text-navy mb-1">{created.name}</h2>
            <p className="text-sm text-gray-400 mb-6">그룹이 생성되었어요! 아래 코드를 친구들에게 공유하세요.</p>
            <div className="bg-navy rounded-xl p-5 mb-2">
              <p className="text-xs text-gray-400 mb-1">초대 코드</p>
              <p className="font-display text-4xl font-bold text-white tracking-[0.2em]">{created.inviteCode}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(created.inviteCode);
              }}
              className="text-xs text-amber-500 hover:underline mb-6 block mx-auto"
            >
              코드 복사하기
            </button>
            <button onClick={() => { router.push("/write"); router.refresh(); }} className="btn-primary w-full">
              시작하기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-navy italic mb-2">newex</h1>
          <p className="text-gray-500 text-sm">시작하기 전에 그룹에 참여해주세요</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          {mode === "choose" && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-navy mb-5 text-center">그룹 설정</h2>
              <button
                onClick={() => setMode("create")}
                className="w-full bg-navy text-white rounded-xl p-4 text-left hover:opacity-90 transition-opacity"
              >
                <p className="font-semibold mb-0.5">새 그룹 만들기</p>
                <p className="text-xs text-gray-400">그룹을 생성하고 친구들을 초대하세요</p>
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="font-semibold text-navy mb-0.5">초대 코드로 참여하기</p>
                <p className="text-xs text-gray-400">친구에게 받은 6자리 코드를 입력하세요</p>
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <button type="button" onClick={() => { setMode("choose"); setError(""); }} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
                ← 돌아가기
              </button>
              <h2 className="text-lg font-bold text-navy">새 그룹 만들기</h2>
              <div>
                <label className="label">그룹 이름</label>
                <input name="name" type="text" required placeholder="예: 우리 팀 경험 기록" maxLength={30} className="input-field" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "생성 중..." : "그룹 만들기"}
              </button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <button type="button" onClick={() => { setMode("choose"); setError(""); }} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
                ← 돌아가기
              </button>
              <h2 className="text-lg font-bold text-navy">초대 코드로 참여</h2>
              <div>
                <label className="label">초대 코드</label>
                <input
                  name="inviteCode"
                  type="text"
                  required
                  placeholder="6자리 코드 입력"
                  maxLength={6}
                  className="input-field uppercase tracking-[0.2em] text-center text-xl font-bold"
                  onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "참여 중..." : "그룹 참여하기"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
