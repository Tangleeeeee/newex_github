"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface MonthEntry { year: number; month: number; }

export default function ReportPage() {
  const router = useRouter();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [pastMonths, setPastMonths] = useState<MonthEntry[]>([]);

  useEffect(() => {
    fetch("/api/report/available-months")
      .then((r) => r.json())
      .then((d) => {
        const currentYM = `${year}-${String(month).padStart(2, "0")}`;
        const filtered = (d.months ?? []).filter(
          (m: MonthEntry) => `${m.year}-${String(m.month).padStart(2, "0")}` < currentYM
        );
        setPastMonths(filtered);
      });
  }, [year, month]);

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

          {pastMonths.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">지난 달 리포트</h2>
              <div className="space-y-2">
                {pastMonths.map((m) => (
                  <button
                    key={`${m.year}-${m.month}`}
                    onClick={() => router.push(`/report/monthly/${m.year}/${m.month}`)}
                    className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{m.year}년 {m.month}월</span>
                    <span className="text-gray-300">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
