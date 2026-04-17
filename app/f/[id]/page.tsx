import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, HardDrive, Calendar, TrendingDown, FileType } from 'lucide-react';
import CopyButton from '@/components/CopyButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getFileEmoji(mime: string): string {
  if (!mime) return '📁';
  if (mime.startsWith('image/'))  return '🖼️';
  if (mime.startsWith('video/'))  return '🎬';
  if (mime.startsWith('audio/'))  return '🎵';
  if (mime.includes('pdf'))       return '📄';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z') || mime.includes('tar')) return '🗜️';
  if (mime.includes('text') || mime.includes('json') || mime.includes('xml')) return '📝';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  return '📁';
}

function getTypeLabel(mime: string): string {
  if (!mime) return 'File';
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG Image', 'image/png': 'PNG Image', 'image/gif': 'GIF Image',
    'image/webp': 'WebP Image', 'video/mp4': 'MP4 Video', 'video/quicktime': 'MOV Video',
    'audio/mpeg': 'MP3 Audio', 'audio/wav': 'WAV Audio',
    'application/pdf': 'PDF Document',
    'application/zip': 'ZIP Archive',
    'text/plain': 'Text File',
  };
  return map[mime] ?? mime.split('/')[1]?.toUpperCase() ?? 'File';
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getFile(id: string) {
  const piUrl = process.env.PI_SERVER_URL;
  if (!piUrl) return null;

  try {
    const res = await fetch(`${piUrl}/file/${id}`, {
      headers: { 'X-API-Key': process.env.PI_API_KEY! },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<{
      id: string;
      name: string;
      size: number;
      mimeType: string;
      uploadedAt: string;
      downloadCount: number;
    }>;
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FilePage({ params }: { params: { id: string } }) {
  const file = await getFile(params.id);
  if (!file) notFound();

  const downloadUrl = `/api/download/${params.id}`;

  return (
    <main className="min-h-screen bg-[#080c14] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
              <HardDrive size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PiShare</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Upload a file →
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm">

            {/* File identity header */}
            <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/0 px-8 pt-10 pb-8 flex flex-col items-center gap-4 text-center border-b border-slate-800/50">
              <div className="w-24 h-24 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center justify-center text-5xl shadow-inner select-none">
                {getFileEmoji(file.mimeType)}
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-100 break-all leading-snug">
                  {file.name}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{getTypeLabel(file.mimeType)}</p>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5">
                    <FileType size={11} />
                    Size
                  </div>
                  <p className="font-semibold text-slate-200">{formatBytes(file.size)}</p>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5">
                    <TrendingDown size={11} />
                    Downloads
                  </div>
                  <p className="font-semibold text-slate-200">{file.downloadCount.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5">
                  <Calendar size={11} />
                  Uploaded
                </div>
                <p className="font-semibold text-slate-200 text-sm">{formatDate(file.uploadedAt)}</p>
              </div>

              {/* Download button */}
              <a
                href={downloadUrl}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl font-semibold transition-all duration-150 shadow-lg shadow-blue-900/30 text-white"
              >
                <Download size={18} />
                Download File
              </a>

              {/* Copy link */}
              <CopyButton />
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-5 flex items-center justify-center gap-1.5">
            <HardDrive size={11} />
            Stored on a personal Raspberry Pi
          </p>
        </div>
      </div>
    </main>
  );
}
