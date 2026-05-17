"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ReportPage() {
  const router = useRouter();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-lg mx-auto px-4 pb-12">
        <div className="mb-8">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-1">Reports</p>
          <h1 className="font-display text-3xl font-bold text-navy">리포트</h1>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/report/monthly/${year}/${month}`)}
            className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-1">Monthly</p>
            <p className="text-lg font-bold text-navy">{year}년 {month}월 리포트</p>
            <p className="text-sm text-gray-400 mt-1">이번 달 경험 요약 및 통계</p>
          </button>

          <button
            onClick={() => router.push(`/report/annual/${year}`)}
            className="w-full bg-navy rounded-2xl p-5 text-left shadow-sm hover:opacity-90 transition-opacity"
          >
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">Annual</p>
            <p className="text-lg font-bold text-white">{year}년 연간 리포트</p>
            <p className="text-sm text-gray-400 mt-1">올 한 해의 경험 총정리</p>
          </button>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">지난 달 리포트</h2>
            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, i) => {
                const d = new Date(year, month - 2 - i, 1);
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                return (
                  <button
                    key={i}
                    onClick={() => router.push(`/report/monthly/${y}/${m}`)}
                    className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{y}년 {m}월</span>
                    <span className="text-gray-300">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
