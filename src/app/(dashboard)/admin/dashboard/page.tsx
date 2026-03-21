"use client";

import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/score-card";
import { Users, CreditCard, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { User, Payment, Assessment } from "@shared/schema";

export default function AdminDashboard() {
  const { data: students, isLoading: isLoadingStudents } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: instructors, isLoading: isLoadingInstructors } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=instruktur"],
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const isLoading = isLoadingStudents || isLoadingInstructors || isLoadingPayments || isLoadingAssessments;

  const totalStudents = students?.length || 0;
  const totalInstructors = instructors?.length || 0;
  const lunas = payments?.filter(p => p.status === "lunas").length || 0;
  const menunggu = payments?.filter(p => p.status === "menunggu_verifikasi").length || 0;
  const passedCount = assessments?.filter(a => a.passed).length || 0;
  const failedCount = assessments?.filter(a => !a.passed).length || 0;
  const notTested = totalStudents - (assessments?.length || 0);

  const pieData = [
    { name: "Lulus", value: passedCount, color: "#059669" },
    { name: "Tidak Lulus", value: failedCount, color: "#DC2626" },
    { name: "Belum Tes", value: Math.max(0, notTested), color: "#D97706" },
  ].filter(d => d.value > 0);

  const barData = [
    { month: "Jan", count: 2 },
    { month: "Feb", count: 3 },
    { month: "Mar", count: lunas },
    { month: "Apr", count: 0 },
    { month: "Mei", count: 0 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse bg-gray-100 rounded-2xl h-80" />
          <div className="animate-pulse bg-gray-100 rounded-2xl h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ScoreCard title="Total Mahasiswa" value={totalStudents} icon={<Users className="w-5 h-5" />} />
        <ScoreCard title="Total Instruktur" value={totalInstructors} icon={<Users className="w-5 h-5" />} accent="#84B179" />
        <ScoreCard title="Pembayaran Lunas" value={lunas} icon={<CreditCard className="w-5 h-5" />} color="#059669" accent="#059669" />
        <ScoreCard title="Menunggu Verifikasi" value={menunggu} icon={<Clock className="w-5 h-5" />} color="#D97706" accent="#D97706" />
        <ScoreCard title="Lulus" value={passedCount} icon={<CheckCircle className="w-5 h-5" />} color="#059669" accent="#059669" />
        <ScoreCard title="Tidak Lulus" value={failedCount} icon={<XCircle className="w-5 h-5" />} color="#DC2626" accent="#DC2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Pembayaran per Bulan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e8e4db", borderRadius: 12 }}
                />
                <Bar dataKey="count" fill="#84B179" radius={[6, 6, 0, 0]} name="Jumlah" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Status Kelulusan</h3>
          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e4db", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm" style={{ color: "#888" }}>Belum ada data penilaian</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
