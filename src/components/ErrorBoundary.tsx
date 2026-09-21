import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Tanpa boundary ini, error render di mana pun akan bikin React meng-unmount
// seluruh aplikasi → layar putih kosong tanpa pesan apa pun. Boundary ini
// menangkapnya dan menampilkan pesan + tombol "Muat Ulang" (sesuai konvensi
// error state di CLAUDE.md) alih-alih layar blank.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-container-low text-center px-6">
          <AlertTriangle className="w-12 h-12 text-error" />
          <div>
            <p className="font-semibold text-on-surface text-lg">Terjadi kesalahan tak terduga</p>
            <p className="text-sm text-on-surface-variant mt-1">Silakan muat ulang halaman. Jika masih bermasalah, coba beberapa saat lagi.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 h-10 px-8 py-2.5 rounded-full bg-primary text-white font-bold uppercase tracking-wider text-sm hover:bg-primary/90 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
