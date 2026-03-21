"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Award, Download, FileText } from "lucide-react";
import type { User, Assessment } from "@shared/schema";

export default function SertifikatManagement() {
  const { toast } = useToast();

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });
  const { data: students, isLoading: isLoadingStudents } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });
  const isLoading = isLoadingAssessments || isLoadingStudents;

  const passedStudents = assessments?.filter(a => a.passed) || [];
  const getStudent = (id: string) => students?.find(s => s.id === id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#888" }}>
          {passedStudents.length} mahasiswa berhak mendapatkan sertifikat
        </p>
        <Button
          data-testid="button-bulk-generate"
          variant="outline"
          className="rounded-xl h-10 text-xs"
          onClick={() => toast({ title: "Info", description: "Fitur generate sertifikat massal akan segera tersedia" })}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" /> Generate Semua
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border p-5" style={{ borderColor: "#e8e4db" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                  <div className="h-3 w-28 rounded bg-gray-100" />
                </div>
                <div className="h-8 w-8 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
         </div>
      ) : passedStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Award className="w-16 h-16 mb-4" style={{ color: "#ccc" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Belum Ada Sertifikat</h3>
          <p className="text-sm" style={{ color: "#888" }}>Belum ada mahasiswa yang dinyatakan lulus</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {passedStudents.map(a => {
            const student = getStudent(a.studentId);
            return (
              <div key={a.id} className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#e8e4db" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: "#84B179", color: "#A2CB8B" }}>
                    {student?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{student?.name}</p>
                    <p className="text-xs" style={{ color: "#888" }}>NIM: {student?.nim} · {student?.faculty}</p>
                    <p className="text-xs mt-1" style={{ color: "#059669" }}>Skor: {a.totalScore}/100 · Lulus</p>
                  </div>
                  <Button
                    data-testid={`download-cert-${a.id}`}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => window.open(`/certificate?studentId=${a.studentId}`, "_blank")}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
