'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Copy, Check, X, HardDrive, Zap } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function getFileEmoji(mime: string): string {
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

// ─── Types ────────────────────────────────────────────────────────────────────
type State = 'idle' | 'selected' | 'uploading' | 'done' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [state, setState] = useState<State>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((f: File) => {
    setFile(f);
    setState('selected');
    setError('');
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) pickFile(f);
    },
    [pickFile]
  );

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const doUpload = async () => {
    if (!file) return;
    setState('uploading');
    setProgress(0);

    // Chunked upload through Vercel API (avoids mixed content + size limits)
    // Each chunk goes: browser → Vercel (HTTPS) → Pi. No HTTPS needed on Pi.
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB chunks — safely under Vercel's limit
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = crypto.randomUUID();

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunk = file.slice(start, start + CHUNK_SIZE);

        const fd = new FormData();
        fd.append('chunk', chunk, file.name);
        fd.append('uploadId', uploadId);
        fd.append('chunkIndex', String(i));
        fd.append('totalChunks', String(totalChunks));
        fd.append('fileName', file.name);
        fd.append('fileSize', String(file.size));
        fd.append('mimeType', file.type || 'application/octet-stream');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });

        if (!res.ok) throw new Error(`Chunk ${i + 1} failed (${res.status})`);

        const data = await res.json();
        setProgress(Math.round(((i + 1) / totalChunks) * 100));

        if (data.done) {
          setShareUrl(`${window.location.origin}/f/${data.id}`);
          setState('done');
          return;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Upload failed: ${msg}`);
      setState('error');
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reset = () => {
    setState('idle');
    setFile(null);
    setProgress(0);
    setShareUrl('');
    setError('');
    setCopied(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-[#080c14] text-white flex flex-col">
      {/* ── Nav ── */}
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
              <HardDrive size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PiShare</span>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Zap size={11} className="text-blue-400" />
            Powered by your Pi
          </span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Tagline */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Share files instantly
            </h1>
            <p className="text-slate-400">
              Drop a file — get a link. Stored on your own hardware.
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm">

            {/* IDLE — Drop zone */}
            {state === 'idle' && (
              <div
                className={`relative p-12 flex flex-col items-center gap-5 cursor-pointer transition-all duration-200 ${
                  dragging
                    ? 'bg-blue-950/60'
                    : 'hover:bg-slate-800/30'
                }`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
              >
                {/* Border glow when dragging */}
                {dragging && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none drop-ring" />
                )}

                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  dragging ? 'bg-blue-500 scale-110' : 'bg-slate-800'
                }`}>
                  <Upload size={30} className={dragging ? 'text-white' : 'text-slate-400'} />
                </div>

                <div className="text-center">
                  <p className="font-semibold text-lg text-slate-100">
                    {dragging ? 'Drop it!' : 'Drop file here or click to browse'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">Any file type · No size limit</p>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>
            )}

            {/* SELECTED — Ready to upload */}
            {state === 'selected' && file && (
              <div className="p-8">
                <div className="flex items-start gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 mb-6">
                  <span className="text-3xl select-none">{getFileEmoji(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-slate-100">{file.name}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    onClick={reset}
                    className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  onClick={doUpload}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl font-semibold transition-all duration-150 shadow-lg shadow-blue-900/30"
                >
                  Upload &amp; Get Link
                </button>

                <button onClick={reset} className="w-full mt-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  Choose different file
                </button>
              </div>
            )}

            {/* UPLOADING — Progress */}
            {state === 'uploading' && file && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{getFileEmoji(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-slate-200">{file.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <span className="text-blue-400 font-semibold text-sm tabular-nums">{progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-slate-500 text-sm text-center">
                  Uploading to your Pi… {progress < 100 ? '' : 'Processing…'}
                </p>
              </div>
            )}

            {/* DONE — Share link */}
            {state === 'done' && (
              <div className="p-8">
                {/* Success badge */}
                <div className="flex flex-col items-center gap-3 mb-7">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center ring-4 ring-emerald-500/10">
                    <Check size={26} className="text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">Uploaded!</p>
                    <p className="text-slate-400 text-sm mt-0.5">Your file is ready to share</p>
                  </div>
                </div>

                {/* Link row */}
                <div className="flex gap-2 mb-5">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={e => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-text"
                  />
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>

                <button
                  onClick={reset}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors"
                >
                  Upload another file
                </button>
              </div>
            )}

            {/* ERROR */}
            {state === 'error' && (
              <div className="p-8">
                <div className="flex flex-col items-center gap-3 mb-7">
                  <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center ring-4 ring-red-500/10">
                    <X size={26} className="text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">Upload failed</p>
                    <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-slate-600 text-xs mt-5 flex items-center justify-center gap-1.5">
            <HardDrive size={11} />
            Files stored on your personal Raspberry Pi
          </p>
        </div>
      </div>
    </main>
  );
}
