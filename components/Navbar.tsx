"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

const navItems = [
  {
    href: "/feed", label: "피드",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: "/profile", label: "내 기록",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    href: "/write", label: "기록", isMain: true,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>,
  },
  {
    href: "/hall-of-fame", label: "명예",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  },
  {
    href: "/report", label: "리포트",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const avatar = session?.user?.profileImage ? (
    <Image src={session.user.profileImage} alt={session.user.username ?? ""} width={28} height={28} className="rounded-full" />
  ) : (
    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
      {(session?.user?.nickname || session?.user?.username)?.[0]?.toUpperCase()}
    </div>
  );

  return (
    <>
      {/* ── 상단 바 ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* 로고 */}
          <Link href="/feed" className="font-display text-lg font-bold text-navy tracking-tight shrink-0">
            newex
          </Link>

          {/* 데스크탑 탭 메뉴 (md 이상) */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              if (item.isMain) {
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? "bg-amber-300 text-navy" : "bg-amber-400 hover:bg-amber-300 text-navy"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    오늘 기록
                  </Link>
                );
              }
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-navy text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 프로필 + 로그아웃 */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            {avatar}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* ── 하단 탭 바 (모바일 전용) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 md:hidden">
        <div className="flex items-end justify-around px-2 h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            if (item.isMain) {
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isActive ? "bg-amber-300" : "bg-amber-400"
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-medium text-gray-500 mt-0.5">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                  isActive ? "text-navy" : "text-gray-400"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
