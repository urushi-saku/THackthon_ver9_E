import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Megaphone, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssignmentStatus, calculateRisk, RiskResult } from '../lib/risk'
import { ChatMessage, chatTopics, mockMessagesByTopic, mockResourcesByTopic } from '../mock/chatData'

const avatarUrl =
  'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=240&q=80'

export function ChatPage() {
  const navigate = useNavigate()
  const { topicId } = useParams()
  const [input, setInput] = useState('')
  const [totalClasses, setTotalClasses] = useState(15)
  const [attendanceRate, setAttendanceRate] = useState(67)
  const [absentClasses, setAbsentClasses] = useState(2)
  const [deadline, setDeadline] = useState('')
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('not_started')
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null)
  const replyTimerRef = useRef<number | null>(null)

  const topic = useMemo(() => chatTopics.find((item) => item.id === topicId), [topicId])
  const initialMessages = useMemo(() => mockMessagesByTopic[topicId ?? ''] ?? [], [topicId])
  const resources = useMemo(() => mockResourcesByTopic[topicId ?? ''] ?? [], [topicId])

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  useEffect(() => {
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current)
      replyTimerRef.current = null
    }
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current)
      }
    }
  }, [])

  if (!topic) {
    return (
      <div className="p-6">
        <p className="text-zinc-700">チャットが見つかりません。</p>
      </div>
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      return
    }

    const nextId = messages.length + 1
    const userMessage: ChatMessage = { id: nextId, role: 'user', text: trimmed }
    console.log('chat submit:', { topicId: topic.id, message: trimmed })

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    replyTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId + 1,
          role: 'assistant',
          text: `${topic.label}の相談を受け取りました。次に必要な情報を教えてください。`,
        },
      ])
    }, 450)
  }

  const handleRiskCheck = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = calculateRisk({
      totalClasses,
      requiredAttendanceRate: attendanceRate / 100,
      absentClasses,
      deadline: deadline ? new Date(deadline) : undefined,
      assignmentStatus,
    })
    setRiskResult(result)
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'assistant', text: result.message },
    ])
  }

  return (
    <div className="flex h-[720px] flex-col bg-[#efefef]">
      <header className="flex items-center gap-3 border-b border-zinc-300 bg-[#f3f3f3] px-4 py-4">
        <button
          onClick={() => {
            console.log('back click')
            navigate('/chat/select')
          }}
          className="rounded-md p-1 text-zinc-700 transition hover:bg-zinc-200"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[34px] font-medium text-zinc-900">{topic.label}</h1>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {topic.id === 'risk' && (
          <form onSubmit={handleRiskCheck} className="rounded-2xl border border-rose-300 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-800">
              <Megaphone className="h-5 w-5 text-[#ff5d5d]" />
              単位リスクをチェック
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-zinc-700">
                授業回数
                <input type="number" min="1" value={totalClasses} onChange={(event) => setTotalClasses(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                必要出席率（%）
                <input type="number" min="0" max="100" value={attendanceRate} onChange={(event) => setAttendanceRate(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                現在の欠席回数
                <input type="number" min="0" value={absentClasses} onChange={(event) => setAbsentClasses(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                課題の状況
                <select value={assignmentStatus} onChange={(event) => setAssignmentStatus(event.target.value as AssignmentStatus)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2">
                  <option value="not_started">未着手</option>
                  <option value="in_progress">進行中</option>
                  <option value="submitted">提出済み</option>
                </select>
              </label>
            </div>
            <label className="mt-3 block text-sm font-medium text-zinc-700">
              課題の締切（任意）
              <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2" />
            </label>
            <button type="submit" className="mt-4 w-full rounded-full bg-[#ff5d5d] px-4 py-2.5 font-bold text-white transition hover:bg-[#ed4949]">
              ぽけ先輩に判定してもらう
            </button>
            {riskResult && (
              <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${riskResult.level >= 2 ? 'bg-rose-100 text-rose-800' : riskResult.level === 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                危険度 {riskResult.level}：{riskResult.label}<br />
                今やること：{riskResult.action}
              </div>
            )}
          </form>
        )}
        {messages.map((message) =>
          message.role === 'assistant' ? (
            <div key={message.id} className="flex items-start gap-2">
              <img src={avatarUrl} alt="ぽけ先輩" className="mt-1 h-9 w-9 rounded-full object-cover" />
              <div className="relative max-w-[78%] rounded-[18px] border border-zinc-500 bg-[#efefef] px-4 py-3 text-xl leading-snug text-zinc-900">
                <div className="absolute -left-[7px] top-3 h-3 w-3 rotate-45 border-b border-l border-zinc-500 bg-[#efefef]" />
                {message.text}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-end">
              <div className="relative max-w-[74%] rounded-[18px] bg-[#efb0b5] px-4 py-3 text-xl leading-snug text-zinc-900">
                <div className="absolute -right-[7px] top-3 h-3 w-3 rotate-45 bg-[#efb0b5]" />
                {message.text}
              </div>
            </div>
          ),
        )}

        {resources.map((resource) => (
          <div key={resource.id} className="ml-14 w-[250px] overflow-hidden rounded-2xl border border-zinc-400">
            <div className="h-[170px] bg-zinc-300" />
            <div className="bg-[#f8f8f8] px-3 py-2 text-xl text-zinc-700">{resource.label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-zinc-200 px-4 py-4">
        <div className="flex items-center gap-3 rounded-full bg-[#dbdbdd] px-3 py-2">
          <button
            type="button"
            onClick={() => console.log('attachment click')}
            className="rounded-full bg-[#ececec] p-1 text-zinc-600 hover:bg-[#f6f6f6]"
          >
            <Plus className="h-8 w-8" />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="ぽけ先輩に質問する"
            className="min-w-0 flex-1 border-0 bg-transparent text-xl text-zinc-700 outline-none placeholder:text-zinc-600"
          />
        </div>
      </form>
    </div>
  )
}
