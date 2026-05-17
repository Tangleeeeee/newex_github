"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/feed");
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        nickname: form.get("nickname"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });
    router.push("/group/setup");
    router.refresh();
    setLoading(false);
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setForgotSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-navy italic mb-2">newex</h1>
          <p className="text-gray-500 text-sm">하루에 하나씩, 새로운 경험을 기록하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {forgotMode ? (
            <>
              <h2 className="text-lg font-semibold text-navy mb-6">비밀번호 찾기</h2>
              {forgotSent ? (
                <div className="text-center py-4">
                  <p className="text-green-600 font-medium mb-2">✓ 이메일이 발송되었습니다</p>
                  <p className="text-sm text-gray-500">이메일을 확인하고 링크를 클릭해 비밀번호를 재설정해주세요.</p>
                  <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="mt-4 text-sm text-amber-600 hover:underline">
                    로그인으로 돌아가기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <input name="email" type="email" required placeholder="가입한 이메일 주소" className="input-field" />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "전송 중..." : "재설정 링크 보내기"}
                  </button>
                  <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-2">
                    돌아가기
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(""); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      tab === t ? "bg-white text-navy shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {t === "login" ? "로그인" : "회원가입"}
                  </button>
                ))}
              </div>

              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input name="username" type="text" required placeholder="아이디" className="input-field" />
                  <input name="password" type="password" required placeholder="비밀번호" className="input-field" />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "로그인 중..." : "로그인"}
                  </button>
                  <button type="button" onClick={() => setForgotMode(true)} className="w-full text-xs text-gray-400 hover:text-gray-600 text-center mt-1">
                    비밀번호를 잊으셨나요?
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <input name="username" type="text" required placeholder="아이디 (로그인용)" minLength={2} maxLength={20} className="input-field" />
                  <input name="nickname" type="text" placeholder="닉네임 (선택, 피드에 표시되는 이름)" maxLength={20} className="input-field" />
                  <input name="email" type="email" required placeholder="이메일" className="input-field" />
                  <input name="password" type="password" required placeholder="비밀번호 (6자 이상)" minLength={6} className="input-field" />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "가입 중..." : "회원가입"}
                  </button>
                </form>
              )}

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2 mx-auto w-fit">
                  또는
                </div>
              </div>

              <button
                onClick={() => signIn("google", { callbackUrl: "/feed" })}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
