import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileQuestion } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-4">
      <FileQuestion className="w-24 h-24 text-slate-300 mb-6" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-6">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-500 mb-8 max-w-md text-center">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link to="/">
        <Button>Kembali ke Beranda</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
