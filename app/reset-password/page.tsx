"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-navy italic mb-2">newex</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-navy mb-6">새 비밀번호 설정</h2>
          {success ? (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-4">✓ 비밀번호가 재설정되었습니다</p>
              <button onClick={() => router.push("/login")} className="btn-primary w-full">로그인하기</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="password" type="password" required placeholder="새 비밀번호 (6자 이상)" minLength={6} className="input-field" />
              <input name="confirm" type="password" required placeholder="비밀번호 확인" className="input-field" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "설정 중..." : "비밀번호 변경"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
