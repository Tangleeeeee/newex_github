"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function GroupJoinPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-md mx-auto px-4 pb-mobile">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy">그룹 참여</h1>
          <p className="text-sm text-gray-400 mt-1">초대 코드를 입력해 그룹에 참여하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">초대 코드</label>
            <input
              name="inviteCode"
              type="text"
              required
              placeholder="6자리 코드 입력 (예: AB1234)"
              maxLength={6}
              className="input-field uppercase tracking-widest text-center text-xl font-bold"
              onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "참여 중..." : "그룹 참여하기"}
          </button>
          <button type="button" onClick={() => router.push("/group/create")} className="w-full text-sm text-gray-400 hover:text-gray-600 text-center py-2">
            새 그룹 만들기
          </button>
        </form>
      </div>
    </div>
  );
}
