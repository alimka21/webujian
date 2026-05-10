import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { GraduationCap, ArrowRight, BookOpen, Users, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function LandingPage() {
  const navigate = useNavigate();
  const [berita, setBerita] = useState<any[]>([]);
  const [alumniStats, setAlumniStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const resBerita = await api.get('/api/berita?limit=3');
        setBerita(resBerita.data || []);

        const resAlumni = await api.get('/api/alumni/stats');
        
        // Transform the dictionary to array for recharts
        const rawStats = resAlumni.perStatus || { BEKERJA: 120, KULIAH: 150, WIRAUSAHA: 30 }; // Fallback data
        const chartData = [
          { name: 'Kerja', value: rawStats.BEKERJA || 0, color: '#3b82f6' },
          { name: 'Kuliah', value: rawStats.KULIAH || 0, color: '#22c55e' },
          { name: 'Wirausaha', value: rawStats.WIRAUSAHA || 0, color: '#eab308' },
        ].filter(d => d.value > 0);
        
        setAlumniStats(chartData.length > 0 ? chartData : [
          { name: 'Kerja', value: 120, color: '#3b82f6' },
          { name: 'Kuliah', value: 150, color: '#22c55e' },
          { name: 'Wirausaha', value: 30, color: '#eab308' },
        ]);
        
      } catch (err) {
        console.error(err);
        // Set fallback data
        setAlumniStats([
          { name: 'Kerja', value: 120, color: '#3b82f6' },
          { name: 'Kuliah', value: 150, color: '#22c55e' },
          { name: 'Wirausaha', value: 30, color: '#eab308' },
        ]);
      }
    };
    fetchPublicData();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Sekolah Hebat</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => window.scrollTo(0, 0)} className="hover:text-blue-600 transition-colors">Beranda</button>
            <button onClick={() => scrollTo('profil')} className="hover:text-blue-600 transition-colors">Profil</button>
            <button onClick={() => scrollTo('berita')} className="hover:text-blue-600 transition-colors">Berita</button>
            <button onClick={() => scrollTo('alumni')} className="hover:text-blue-600 transition-colors">Alumni</button>
          </div>

          <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
            Login Portal
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium rounded-full">
              Penerimaan Siswa Baru 2024/2025
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Membangun Generasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Pemimpin Masa Depan</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              Sistem manajemen sekolah terpadu yang memadukan keunggulan akademik, karakter mulia, dan wawasan global untuk menyongsong masa depan yang cerah.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-full h-12 px-8 text-base">
                Mulai Jelajah
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base gap-2 bg-white">
                Lihat Brosur <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop" 
              alt="Siswa bahagia" 
              className="rounded-[3rem] shadow-2xl object-cover aspect-[4/3] w-full"
            />
          </div>
        </div>
      </section>

      {/* Profil Sekolah */}
      <section id="profil" className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Profil & Identitas Sekolah</h2>
            <p className="text-slate-500 text-lg">Mengenal lebih dekat lingkungan dan budaya belajar di institusi kami.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <img src="https://images.unsplash.com/photo-1546410531-bea5aadcb6ce?q=80&w=800&auto=format&fit=crop" alt="Fasilitas" className="rounded-3xl shadow-lg" />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h3 className="text-2xl font-bold text-slate-900">Sejarah Singkat</h3>
              <p className="text-slate-600 leading-relaxed">
                Berdiri sejak tahun 2005, sekolah ini telah mendedikasikan diri untuk mencetak lulusan berprestasi yang siap mengabdi pada masyarakat. Dengan kurikulum yang beradaptasi pada perkembangan zaman, kami memastikan setiap siswa mendapatkan pendidikan terbaik.
              </p>
              <ul className="space-y-3">
                {['Akreditasi A Nasional', 'Fasilitas Laboratorium Lengkap', 'Pengajar Tersertifikasi', 'Lingkungan Hijau & Asri'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Visi Misi */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-blue-600 text-white border-0 shadow-lg shadow-blue-500/20">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold mb-4">Visi</h4>
                <p className="text-blue-100 leading-relaxed">
                  "Menjadi lembaga pendidikan terdepan yang menghasilkan insan berkarakter mulia, cerdas, terampil, dan berwawasan global."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 text-white border-0 shadow-lg shadow-slate-900/20">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold mb-4">Misi</h4>
                <ul className="space-y-2 text-slate-300 list-disc pl-5">
                  <li>Menyelenggarakan pendidikan yang bermutu tinggi.</li>
                  <li>Membina karakter jujur, disiplin, dan bertanggung jawab.</li>
                  <li>Mengembangkan potensi minat dan bakat secara optimal.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold mb-4 text-slate-900">Tujuan</h4>
                <p className="text-slate-600 leading-relaxed">
                  Mempersiapkan siswa untuk melanjutkan ke jenjang pendidikan yang lebih tinggi atau memasuki dunia wirausaha dan dunia kerja dengan bekal kompetensi yang relevan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section className="py-20 bg-slate-50 px-4 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Kurikulum Terpadu</h4>
              <p className="text-sm text-slate-500">Menggabungkan kurikulum nasional dengan program pengembangan soft skill.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Tenaga Pendidik</h4>
              <p className="text-sm text-slate-500">Guru-guru profesional yang berdedikasi dan inspiratif dalam mengajar.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Segudang Prestasi</h4>
              <p className="text-sm text-slate-500">Berbagai kejuaraan di tingkat regional hingga nasional berhasil diraih.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2">Fasilitas Modern</h4>
              <p className="text-sm text-slate-500">Lingkungan belajar yang didukung dengan teknologi terbaru dan ruang yang nyaman.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats & Alumni Tracer */}
      <section id="alumni" className="py-20 bg-slate-900 text-white px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Statistik & Persebaran Alumni</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Kami bangga dengan pencapaian ribuan alumni yang kini telah tersebar di berbagai sektor profesional, membuktikan kualitas lulusan kami.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                   <div className="text-4xl font-extrabold text-blue-400 mb-2">1,250+</div>
                   <div className="text-sm text-slate-300 font-medium">Siswa Aktif</div>
                </div>
                <div>
                   <div className="text-4xl font-extrabold text-green-400 mb-2">85+</div>
                   <div className="text-sm text-slate-300 font-medium">Tenaga Pendidik</div>
                </div>
                <div>
                   <div className="text-4xl font-extrabold text-purple-400 mb-2">15,000+</div>
                   <div className="text-sm text-slate-300 font-medium">Total Alumni</div>
                </div>
                <div>
                   <div className="text-4xl font-extrabold text-orange-400 mb-2">320+</div>
                   <div className="text-sm text-slate-300 font-medium">Prestasi Nasional</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-6">Tracer Study Angkatan Terakhir</h3>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={alumniStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {alumniStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6">
                 {alumniStats.map((stat) => (
                   <div key={stat.name} className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></span>
                     <span className="text-sm text-slate-300">{stat.name}</span>
                   </div>
                 ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Berita Terbaru */}
      <section id="berita" className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Berita & Informasi Utama</h2>
              <p className="text-slate-500">Ikuti perkembangan terbaru dari lingkungan sekolah.</p>
            </div>
            <Link to="/berita" className="text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 transition-colors">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {berita.length === 0 ? (
               [1, 2, 3].map(i => (
                 <Card key={i} className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col group cursor-pointer animate-pulse">
                   <div className="h-48 bg-slate-200 w-full"></div>
                   <CardContent className="p-6">
                     <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                     <div className="h-6 bg-slate-200 rounded w-full mb-2"></div>
                     <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                     <div className="h-4 bg-slate-200 rounded w-full"></div>
                   </CardContent>
                 </Card>
               ))
            ) : (
              berita.map(b => (
                <Link to={`/berita/${b.slug}`} key={b.id} className="block group">
                  <Card className="border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    <div className="h-48 overflow-hidden bg-slate-100 relative">
                      {b.imageUrl ? (
                        <img 
                          src={b.imageUrl} 
                          alt={b.judul} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                           <BookOpen className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                         <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm border-0 font-semibold shadow-sm">
                           {new Date(b.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric'})}
                         </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {b.judul}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                        {b.ringkasan}
                      </p>
                      <div className="flex items-center text-sm font-semibold text-blue-600 mt-auto">
                        Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Sekolah Hebat</span>
            </div>
            <p className="text-sm leading-relaxed">
              Pusat pendidikan terdepan yang mendidik generasi berprestasi dan berintegritas.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Tautan Cepat</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => scrollTo('profil')} className="hover:text-white transition-colors">Profil Sekolah</button></li>
              <li><button onClick={() => scrollTo('berita')} className="hover:text-white transition-colors">Berita & Pengumuman</button></li>
              <li><button onClick={() => scrollTo('alumni')} className="hover:text-white transition-colors">Tracer Alumni</button></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Portal Siswa/Guru</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Hubungi Kami</h4>
            <div className="space-y-3 text-sm">
              <p>Jl. Pendidikan No. 123, Kota Pelajar, Indonesia 12345</p>
              <p>Email: info@sekolahhebat.sch.id</p>
              <p>Telepon: (021) 555-0123</p>
            </div>
            {/* Dummy Map Placeholder */}
            <div className="w-full h-32 bg-slate-800 rounded-xl mt-6 flex items-center justify-center border border-slate-700/50 overflow-hidden relative">
               <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Jakarta&zoom=13&size=600x300&maptype=roadmap&style=element:geometry%7Ccolor:0x242f3e&style=element:labels.text.stroke%7Ccolor:0x242f3e&style=element:labels.text.fill%7Ccolor:0x746855&key=invalid_key')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
               <span className="relative z-10 text-xs font-semibold uppercase tracking-widest text-slate-500">Peta Lokasi</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Sekolah Hebat. Semua hak dilindungi.</p>
          <div className="flex gap-4">
            {/* Social Links Placeholders */}
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
