import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900">SMA Bintang Pelajar</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#profil" className="text-sm font-medium text-gray-600 hover:text-blue-600">Profil</a>
            <a href="#akademik" className="text-sm font-medium text-gray-600 hover:text-blue-600">Akademik</a>
            <a href="#berita" className="text-sm font-medium text-gray-600 hover:text-blue-600">Berita</a>
            <a href="#alumni" className="text-sm font-medium text-gray-600 hover:text-blue-600">Tracer Alumni</a>
          </nav>
          <div className="flex gap-4">
            <Link to="/login">
              <Button>Portal Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8">
              Mendidik Generasi <br/>
              <span className="text-blue-600">Pemimpin Masa Depan</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 mb-10">
              Sistem informasi akademik terpadu SMA Bintang Pelajar. Memfasilitasi siswa, guru, dan alumni dalam satu ekosistem digital yang modern.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 text-base">Pendaftaran Siswa Baru</Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">Jelajahi Fasilitas</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
