"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ExperienceCard from "@/components/ExperienceCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CATEGORY_LABELS } from "@/lib/constants";

const COLORS = ["#f59e0b","#1a1f36","#10b981","#3b82f6","#8b5cf6","#ef4444","#f97316","#06b6d4","#64748b"];

export default function MonthlyReportPage({ params }: { params: { year: string; month: string } }) {
  useSession();
  const year = parseInt(params.year);
  const month = parseInt(params.month);
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/group/my").then((r) => r.json()).then((d) => {
      if (d.groups?.length) { setGroups(d.groups); setGroupId(d.groups[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!groupId) return;
    fetch(`/api/report/monthly/${year}/${month}?groupId=${groupId}`)
      .then((r) => r.json()).then(setReport);
  }, [groupId, year, month]);

  const categoryData = report
    ? Object.entries(report.categoryCount as Record<string, number>).map(([k, v]) => ({
        name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] ?? k,
        value: v,
      }))
    : [];

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-lg mx-auto px-4 pb-mobile">
        <div className="mb-6">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-1">Monthly Report</p>
          <h1 className="font-display text-3xl font-bold text-navy">{year}년 {month}월</h1>
        </div>

        {groups.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto">
            {groups.map((g) => (
              <button key={g.id} onClick={() => setGroupId(g.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${groupId === g.id ? "bg-navy text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {report && (
          <div className="space-y-5">
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                <p className="text-3xl font-bold text-navy">{report.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-400 mt-1">평균 별점</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                <p className="text-3xl font-bold text-red-400">{report.missedDays as number}</p>
                <p className="text-xs text-gray-400 mt-1">미등록 일수</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-red-500">{((report.missedDays as number) * 1000).toLocaleString()}원</p>
              <p className="text-xs text-gray-400 mt-1">이 달 벌금 (1일 미등록 = 1,000원)</p>
            </div>

            {/* 명예의 전당 */}
            {report.hallOfFame && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-navy mb-4">🏆 이달의 명예의 전당</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">최고</p>
                    <ExperienceCard experience={report.hallOfFame.bestExperience} showUser={false} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-2">최악</p>
                    <ExperienceCard experience={report.hallOfFame.worstExperience} showUser={false} />
                  </div>
                </div>
              </div>
            )}

            {/* 별점 추이 차트 */}
            {report.monthlyAvgs?.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-navy mb-4">📈 월별 평균 별점</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={report.monthlyAvgs} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tickFormatter={(v) => `${v}월`} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number | string) => (typeof v === "number" ? v.toFixed(1) : v)} />
                    <Bar dataKey="avg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 카테고리 분포 */}
            {categoryData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-navy mb-4">📊 카테고리 분포</h2>
                <div className="flex items-center gap-4">
                  <PieChart width={140} height={140}>
                    <Pie data={categoryData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div className="flex-1 space-y-1.5">
                    {categoryData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{d.name}</span>
                        <span className="ml-auto text-gray-400 font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
