import { ArrowLeft, BookOpen, Mic, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SummaryPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[720px] bg-white">
      <header className="flex items-center gap-4 border-b border-zinc-200 px-4 py-3">
        <button onClick={() => navigate('/')} aria-label="戻る"><ArrowLeft className="h-6 w-6 text-zinc-600" /></button>
        <BookOpen className="h-6 w-6 text-[#ff5d5d]" />
        <h1 className="text-lg font-medium">講義の要約</h1>
      </header>

      <main className="space-y-12 px-5 pt-28">
        <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-[#ff5d5d] bg-white text-2xl text-zinc-900 transition hover:bg-rose-50">
          <Upload className="mb-2 h-7 w-7 text-[#ff5d5d]" />
          PDFを選択
          <input type="file" accept="application/pdf" className="hidden" />
        </label>

        <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-zinc-600 bg-zinc-200 text-zinc-700 transition hover:bg-zinc-100">
          <Mic className="mb-1 h-7 w-7" />
          <span className="text-2xl">音声を録音</span>
          <span className="my-1 text-sm">または</span>
          <span className="text-xl">音声ファイルを選択</span>
          <input type="file" accept="audio/*" className="hidden" />
        </label>
      </main>
    </div>
  )
}
