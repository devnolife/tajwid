import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login";
import Layout from "@/components/layout";

import MahasiswaDashboard from "@/pages/mahasiswa/dashboard";
import Pembayaran from "@/pages/mahasiswa/pembayaran";
import JadwalSaya from "@/pages/mahasiswa/jadwal";
import HasilMengaji from "@/pages/mahasiswa/hasil";
import Sertifikat from "@/pages/mahasiswa/sertifikat";

import InstrukturDashboard from "@/pages/instruktur/dashboard";
import DaftarMahasiswa from "@/pages/instruktur/mahasiswa-list";
import Penilaian from "@/pages/instruktur/penilaian";

import AdminDashboard from "@/pages/admin/dashboard";
import MahasiswaManagement from "@/pages/admin/mahasiswa-management";
import InstrukturManagement from "@/pages/admin/instruktur-management";
import PembayaranManagement from "@/pages/admin/pembayaran-management";
import JadwalManagement from "@/pages/admin/jadwal-management";
import PenilaianManagement from "@/pages/admin/penilaian-management";
import SertifikatManagement from "@/pages/admin/sertifikat-management";
import Pengaturan from "@/pages/admin/pengaturan";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF7F0" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#84B179]/20 border-t-[#84B179] rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: "#888" }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderPage = () => {
    if (user.role === "mahasiswa") {
      switch (currentPage) {
        case "Dashboard": return <MahasiswaDashboard />;
        case "Pembayaran": return <Pembayaran />;
        case "Jadwal Saya": return <JadwalSaya />;
        case "Hasil Mengaji": return <HasilMengaji />;
        case "Sertifikat": return <Sertifikat />;
        default: return <MahasiswaDashboard />;
      }
    }

    if (user.role === "instruktur") {
      switch (currentPage) {
        case "Dashboard": return <InstrukturDashboard />;
        case "Daftar Mahasiswa": return <DaftarMahasiswa onSelectStudent={(id) => { setSelectedStudentId(id); setCurrentPage("Penilaian"); }} />;
        case "Penilaian": return <Penilaian studentId={selectedStudentId} onBack={() => { setSelectedStudentId(null); setCurrentPage("Daftar Mahasiswa"); }} />;
        default: return <InstrukturDashboard />;
      }
    }

    if (user.role === "admin") {
      switch (currentPage) {
        case "Dashboard": return <AdminDashboard />;
        case "Mahasiswa": return <MahasiswaManagement />;
        case "Instruktur": return <InstrukturManagement />;
        case "Pembayaran": return <PembayaranManagement />;
        case "Jadwal": return <JadwalManagement />;
        case "Penilaian & Hasil": return <PenilaianManagement />;
        case "Sertifikat": return <SertifikatManagement />;
        case "Pengaturan": return <Pengaturan />;
        default: return <AdminDashboard />;
      }
    }

    return <div>Unknown role</div>;
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
