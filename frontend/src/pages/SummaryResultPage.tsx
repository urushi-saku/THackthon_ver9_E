import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, FileText, LoaderCircle, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useLocation, useNavigate } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
type LocationState = { file?: File }

export function SummaryResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const file = (location.state as LocationState | null)?.file
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(file))

  useEffect(() => {
    if (!file) return
    const controller = new AbortController()

    const summarize = async () => {
      const startedAt = Date.now()
      setIsLoading(true)
      setError('')
      setSummary('')
      const formData = new FormData()
      formData.append('attachment', file)
      try {
        const response = await fetch(`${apiUrl}/summary`, { method: 'POST', body: formData, signal: controller.signal })
        const data = await response.json() as { summary?: string; detail?: string }
        if (!response.ok || !data.summary) throw new Error(data.detail || '要約を取得できませんでした')
        setSummary(data.summary)
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : '要約を取得できませんでした')
      } finally {
        // Strict Modeの検証用リクエストが中断された場合は、
        // 続けて開始される本リクエストのローディング表示を消さない。
        if (!controller.signal.aborted) {
          const remainingMs = Math.max(0, 800 - (Date.now() - startedAt))
          if (remainingMs > 0) await new Promise((resolve) => window.setTimeout(resolve, remainingMs))
          if (!controller.signal.aborted) setIsLoading(false)
        }
      }
    }

    summarize()
    return () => controller.abort()
  }, [file])

  return (
    <div className="flex min-h-[720px] flex-col bg-white">
      <header className="flex items-center gap-4 border-b border-zinc-200 px-4 py-3">
        <button onClick={() => navigate('/summary')} aria-label="ファイル選択へ戻る"><ArrowLeft className="h-6 w-6 text-zinc-600" /></button>
        <BookOpen className="h-6 w-6 text-[#ff5d5d]" />
        <h1 className="text-lg font-medium">講義の要約結果</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6">
        {!file ? (
          <div className="py-24 text-center"><p className="text-zinc-600">要約するファイルが選択されていません。</p><button onClick={() => navigate('/summary')} className="mt-5 rounded-full border border-[#ff5d5d] px-5 py-2 text-[#ff5d5d]">ファイルを選択</button></div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3"><FileText className="h-6 w-6 shrink-0 text-[#ff5d5d]" /><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-800">{file.name}</p><p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p></div></div>
            {isLoading && <div className="flex flex-col items-center py-24 text-zinc-600" role="status" aria-live="polite"><LoaderCircle className="mb-4 h-9 w-9 animate-spin text-[#ff5d5d]" /><p className="text-lg font-medium">要約中・・・</p><p className="mt-2 text-xs text-zinc-400">内容によって少し時間がかかります</p></div>}
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><p className="text-sm text-red-700">{error}</p><button onClick={() => navigate('/summary')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-red-600"><RotateCcw className="h-4 w-4" />別のファイルを選ぶ</button></div>}
            {summary && <article className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-800 shadow-sm"><ReactMarkdown components={{ h2: ({ children }) => <h2 className="mb-2 mt-5 border-b border-rose-200 pb-2 text-lg font-bold first:mt-0">{children}</h2>, h3: ({ children }) => <h3 className="mb-1 mt-4 font-bold">{children}</h3>, p: ({ children }) => <p className="my-2">{children}</p>, ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>, ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>, strong: ({ children }) => <strong className="font-bold text-zinc-950">{children}</strong> }}>{summary}</ReactMarkdown></article>}
          </>
        )}
      </main>
    </div>
  )
}
