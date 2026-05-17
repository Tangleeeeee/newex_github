"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ExperienceCard from "@/components/ExperienceCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CATEGORY_LABELS } from "@/lib/constants";

const COLORS = ["#f59e0b","#1a1f36","#10b981","#3b82f6","#8b5cf6","#ef4444","#f97316","#06b6d4","#64748b"];

export default function AnnualReportPage({ params }: { params: { year: string } }) {
  const year = parseInt(params.year);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/report/annual/${year}`).then((r) => r.json()).then(setReport);
  }, [year]);

  const categoryData = report
    ? Object.entries(report.categoryCount as Record<string, number>).map(([k, v]) => ({
        name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] ?? k,
        value: v,
      }))
    : [];

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      <div className="pt-20 max-w-lg mx-auto px-4 pb-12">
        <div className="mb-6">
          <p className="text-sm text-amber-500 font-semibold tracking-widest uppercase mb-1">Annual Report</p>
          <h1 className="font-display text-3xl font-bold text-navy">{year}년</h1>
        </div>

        {report && (
          <div className="space-y-5">
            {/* 총 기록 */}
            <div className="bg-navy rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400 mb-1">올해 총 기록</p>
              <p className="font-display text-5xl font-bold text-white">{report.totalCount}</p>
              <p className="text-amber-400 mt-1 text-sm">개의 새로운 경험</p>
            </div>

            {/* 올해의 베스트 */}
            {report.annualReport && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-navy mb-3">🌟 올해의 베스트 경험</h2>
                <ExperienceCard experience={report.annualReport.bestExperience} showUser={false} />
              </div>
            )}

            {/* 월별 평균 별점 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-navy mb-4">📈 월별 평균 별점</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={report.monthlyAvgs} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tickFormatter={(v) => `${v}월`} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number | string) => (typeof v === "number" ? v.toFixed(1) : v)} />
                  <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

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

            {/* 월별 명예의 전당 타임라인 */}
            {report.monthlyHallOfFames?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-navy mb-4">🏆 월별 명예의 전당</h2>
                <div className="space-y-4">
                  {(report.monthlyHallOfFames as Record<string, unknown>[]).map((hof) => (
                    <div key={hof.id}>
                      <p className="text-xs font-semibold text-gray-400 mb-2">{hof.month}월</p>
                      <div className="grid grid-cols-2 gap-2">
                        <ExperienceCard experience={hof.bestExperience} showUser={false} />
                        <ExperienceCard experience={hof.worstExperience} showUser={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
