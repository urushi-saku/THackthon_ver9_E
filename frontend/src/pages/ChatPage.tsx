import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, MessageCircle, Plus, Send, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AssignmentStatus, calculateRisk } from '../lib/risk'
import { ChatMessage } from '../mock/chatData'

const avatarUrl = 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=240&q=80'
const suggestions = ['この授業って難しい？', 'あと何回休める？', '課題は何から始める？']
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type LocationState = { initialMessage?: string }

export function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialMessage = (location.state as LocationState | null)?.initialMessage?.trim() ?? ''
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: 'こんにちは、ぽけ先輩です。授業、課題、試験のこと、なんでも話してね。' },
  ])
  const [showStatus, setShowStatus] = useState(false)
  const [totalClasses, setTotalClasses] = useState(15)
  const [attendanceRate, setAttendanceRate] = useState(67)
  const [absentClasses, setAbsentClasses] = useState(2)
  const [deadline, setDeadline] = useState('')
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('not_started')
  const didHandleInitial = useRef(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const createReply = useCallback((message: string) => {
    if (/休|欠席|出席/.test(message)) {
      return calculateRisk({ totalClasses, requiredAttendanceRate: attendanceRate / 100, absentClasses, assignmentStatus, deadline: deadline ? new Date(deadline) : undefined }).message
    }
    if (/課題|レポート|締切/.test(message)) {
      if (deadline) {
        return calculateRisk({ totalClasses, requiredAttendanceRate: attendanceRate / 100, absentClasses, assignmentStatus, deadline: new Date(deadline) }).message
      }
      return '課題は、まず資料を開いて「提出物・締切・評価基準」の3つを確認しよう。最初の10分で見出しだけ作ると進めやすいよ！'
    }
    if (/難しい|試験|テスト/.test(message)) {
      return 'この授業の先輩データはまだ登録されていないので、一般的な方法で答えるね。直前に詰め込むより、講義ごとの要点を短く復習するのがおすすめ。まず今日の範囲を15分だけ振り返ろう！'
    }
    if (/用語|意味|わから/.test(message)) {
      return 'もちろん。分からない言葉をそのまま送ってね。講義でどう使われているかも含めて、かみ砕いて説明するよ。'
    }
    return '相談してくれてありがとう。状況に合った答えを考えたいので、授業名や締切、困っていることをもう少し教えてね。'
  }, [absentClasses, assignmentStatus, attendanceRate, deadline, totalClasses])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const id = Date.now()
    setMessages((prev) => [...prev, { id, role: 'user', text: trimmed }])
    window.setTimeout(async () => {
      let reply = createReply(trimmed)
      try {
        const response = await fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'demo-user',
            message: trimmed,
            user_settings: {
              context: {
                total_classes: totalClasses,
                required_attendance_rate: attendanceRate / 100,
                absent_classes: absentClasses,
                assignment_status: assignmentStatus,
                deadline: deadline || null,
              },
            },
          }),
        })
        if (response.ok) {
          const data = await response.json() as { reply: string }
          reply = data.reply
        }
      } catch {
        // API未起動時も、ルールベースの案内でデモを継続する。
      }
      setMessages((prev) => [...prev, { id: id + 1, role: 'assistant', text: reply }])
    }, 350)
  }, [absentClasses, assignmentStatus, attendanceRate, createReply, deadline, totalClasses])

  useEffect(() => {
    if (initialMessage && !didHandleInitial.current) {
      didHandleInitial.current = true
      sendMessage(initialMessage)
      window.history.replaceState({}, document.title)
    }
  }, [initialMessage, sendMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex h-[720px] flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <button onClick={() => navigate('/')} className="p-1 text-zinc-700 hover:text-black" aria-label="ホームへ戻る"><ArrowLeft className="h-6 w-6" /></button>
        <MessageCircle className="h-7 w-7 fill-rose-200 text-rose-200" />
        <div className="flex-1"><h1 className="text-xl font-medium text-zinc-900">ぽけ先輩に相談</h1></div>
        <Sparkles className="h-5 w-5 text-[#ff5d5d]" />
      </header>

      <div className="border-b border-zinc-200 bg-white px-4 py-2">
        <button onClick={() => setShowStatus((value) => !value)} className="flex w-full items-center justify-between text-sm font-medium text-zinc-600">
          より自分に合った回答のために状況を登録
          <ChevronDown className={`h-4 w-4 transition ${showStatus ? 'rotate-180' : ''}`} />
        </button>
        {showStatus && (
          <div className="mt-3 grid grid-cols-2 gap-2 pb-2 text-xs">
            <label>授業回数<input type="number" min="1" value={totalClasses} onChange={(e) => setTotalClasses(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <label>必要出席率（%）<input type="number" min="0" max="100" value={attendanceRate} onChange={(e) => setAttendanceRate(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <label>欠席回数<input type="number" min="0" value={absentClasses} onChange={(e) => setAbsentClasses(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <label>課題状況<select value={assignmentStatus} onChange={(e) => setAssignmentStatus(e.target.value as AssignmentStatus)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2"><option value="not_started">未着手</option><option value="in_progress">進行中</option><option value="submitted">提出済み</option></select></label>
            <label className="col-span-2">課題の締切<input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-7">
        {messages.map((message) => message.role === 'assistant' ? (
          <div key={message.id} className="flex items-start gap-2"><img src={avatarUrl} alt="" className="mt-1 h-9 w-9 rounded-full object-cover" /><div className="max-w-[78%] rounded-2xl rounded-tl-sm border border-zinc-400 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-800">{message.text}</div></div>
        ) : (
          <div key={message.id} className="flex justify-end"><div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#ffadb3] px-4 py-3 text-sm leading-relaxed text-zinc-900">{message.text}</div></div>
        ))}
        {messages.length === 1 && <div className="ml-10 flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} onClick={() => sendMessage(item)} className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs text-zinc-700 hover:bg-rose-50">{item}</button>)}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-zinc-200 bg-white p-3">
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2">
          <button type="button" className="text-zinc-500" aria-label="資料を追加"><Plus className="h-6 w-6" /></button>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="ぽけ先輩に話しかける" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button type="submit" className="rounded-full bg-[#ff5d5d] p-2 text-white" aria-label="送信"><Send className="h-4 w-4" /></button>
        </div>
      </form>
    </div>
  )
}

