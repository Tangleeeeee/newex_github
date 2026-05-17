"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const navItems = [
  { href: "/feed", label: "피드" },
  { href: "/profile", label: "내 기록" },
  { href: "/hall-of-fame", label: "명예의 전당" },
  { href: "/report", label: "리포트" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="font-display text-lg font-bold text-navy tracking-tight">
          newex
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-navy text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* 오늘 경험 기록 버튼 */}
          <Link
            href="/write"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/write"
                ? "bg-amber-400 text-navy"
                : "bg-amber-400 hover:bg-amber-300 text-navy"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            오늘 기록
          </Link>

          {session?.user?.profileImage ? (
            <Image
              src={session.user.profileImage}
              alt={session.user.username ?? ""}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
              {(session?.user?.nickname || session?.user?.username)?.[0]?.toUpperCase()}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
