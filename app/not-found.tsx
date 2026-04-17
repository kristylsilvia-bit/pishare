import Link from 'next/link';
import { HardDrive, FileX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#080c14] text-white flex flex-col">
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 w-fit hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <HardDrive size={15} />
          </div>
          <span className="font-bold text-lg tracking-tight">PiShare</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileX size={36} className="text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">File not found</h1>
          <p className="text-slate-400 mb-8">
            This file may have been deleted or the link is incorrect.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
          >
            Upload a file
          </Link>
        </div>
      </div>
    </main>
  );
}
