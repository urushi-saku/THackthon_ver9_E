import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, FileText, Plus, Send, Sparkles, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AssignmentStatus, calculateRisk, RiskResult } from '../lib/risk';
import { ChatMessage, otherTopics, weeklySchedule } from '../mock/chatData'
import './ChatPage.css'

const avatarUrl = '/poke-senpai.jpg'
const suggestions = ['この授業って難しい？', 'あと何回休める？', '課題は何から始める？', '喝を入れて！']
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type LocationState = { initialMessage?: string }
type KatsuStage = 'idle' | 'impact' | 'commitment'

/**
 * 選択されたトピックの名称をIDから検索します。
 * @param topicId - URLから取得したトピックID
 * @returns トピックの名称。見つからない場合は 'チャット' を返します。
 */
function findTopicName(topicId?: string): string {
  if (!topicId) return 'チャット'

  // 曜日ごとの授業リストから検索
  for (const day in weeklySchedule) {
    const lecture = weeklySchedule[day as keyof typeof weeklySchedule].find(
      (l) => l.id === topicId,
    )
    if (lecture) return lecture.name
  }

  // その他のトピックから検索
  const other = otherTopics.find((t: { id: string; name: string }) => t.id === topicId)
  if (other) return other.name

  return 'チャット'
}

function deadlineAtEndOfDay(month: number, day: number): Date | undefined {
  const year = new Date().getFullYear()
  const deadline = new Date(year, month - 1, day, 23, 59, 59, 999)
  if (deadline.getFullYear() !== year || deadline.getMonth() !== month - 1 || deadline.getDate() !== day) {
    return undefined
  }
  return deadline
}

export function ChatPage() {
  const navigate = useNavigate()
  // URLのパラメータから :topicId を取得
  const { topicId } = useParams<{ topicId: string }>()
  const location = useLocation()
  const initialMessage = (location.state as LocationState | null)?.initialMessage?.trim() ?? ''
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  // topicIdごとに会話履歴をlocalStorageから読み込むように変更
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    let savedMessages: string | null = null;
    try {
      savedMessages = localStorage.getItem(`chatHistory_${topicId}`);
    } catch (error) {
      console.error('Failed to access localStorage', error);
    }

    if (savedMessages) {
      return JSON.parse(savedMessages) as ChatMessage[];
    }

    // 履歴がない場合は初期メッセージをセット
    return [{ id: 1, role: 'assistant', text: 'こんにちは、ぽけ先輩です。授業、課題、試験のこと、なんでも話してね。' }];
  });
  const [showStatus, setShowStatus] = useState(false)
  const [totalClasses, setTotalClasses] = useState(15)
  const [absenceAllowance, setAbsenceAllowance] = useState(5)
  const [absentClasses, setAbsentClasses] = useState(0)
  const [missedAssignments, setMissedAssignments] = useState(0)
  const [deadlineMonth, setDeadlineMonth] = useState(() => new Date().getMonth() + 1)
  const [deadlineDay, setDeadlineDay] = useState(() => new Date().getDate())
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('not_started')
  const [katsuStage, setKatsuStage] = useState<KatsuStage>('idle')
  const [katsuResult, setKatsuResult] = useState<RiskResult | null>(null)
  const [commitmentChecked, setCommitmentChecked] = useState(false)
  const didHandleInitial = useRef(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const katsuTimerRef = useRef<number | null>(null)

  // topicIdから現在のチャットのタイトルを取得
  const topicName = findTopicName(topicId)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const requiredAttendanceRate = totalClasses > 0
    ? Math.max(0, Math.min(100, ((totalClasses - absenceAllowance) / totalClasses) * 100))
    : 0

  const triggerKatsu = useCallback((result: RiskResult) => {
    setKatsuResult(result)
    setCommitmentChecked(false)
    setKatsuStage('impact')
    navigator.vibrate?.([120, 60, 120, 60, 180])
    if (katsuTimerRef.current !== null) window.clearTimeout(katsuTimerRef.current)
    katsuTimerRef.current = window.setTimeout(() => {
      setKatsuStage('commitment')
      katsuTimerRef.current = null
    }, 1400)
  }, [])

  const createReply = useCallback((message: string) => {
    const deadline = deadlineAtEndOfDay(deadlineMonth, deadlineDay)
    if (/喝|サボ|やる気|危険度|落単/.test(message)) {
      return calculateRisk({ totalClasses, requiredAttendanceRate: requiredAttendanceRate / 100, remainingAbsenceAllowance: absenceAllowance, absentClasses, missedAssignments, assignmentStatus, deadline }).message
    }
    if (/休|欠席|出席/.test(message)) {
      return calculateRisk({ totalClasses, requiredAttendanceRate: requiredAttendanceRate / 100, remainingAbsenceAllowance: absenceAllowance, absentClasses, missedAssignments, assignmentStatus, deadline }).message
    }
    if (/課題|レポート|締切/.test(message)) {
      if (deadline) {
        return calculateRisk({ totalClasses, requiredAttendanceRate: requiredAttendanceRate / 100, remainingAbsenceAllowance: absenceAllowance, absentClasses, missedAssignments, assignmentStatus, deadline }).message
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
  }, [absenceAllowance, absentClasses, assignmentStatus, deadlineDay, deadlineMonth, missedAssignments, requiredAttendanceRate, totalClasses])

  const sendMessage = useCallback((text: string, attachment?: File) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const id = Date.now()
    setMessages((prev) => [...prev, { id, role: 'user', text: trimmed }])
    setIsThinking(true)
    window.setTimeout(async () => {
      let reply = createReply(trimmed)
      const isEncouragementRequest = /喝|サボ|やる気|危険度|落単/.test(trimmed)
      let diagnosedRisk: RiskResult | null = null
      try {
        const deadline = deadlineAtEndOfDay(deadlineMonth, deadlineDay)
        if (isEncouragementRequest) {
          diagnosedRisk = calculateRisk({ totalClasses, requiredAttendanceRate: requiredAttendanceRate / 100, remainingAbsenceAllowance: absenceAllowance, absentClasses, missedAssignments, assignmentStatus, deadline })
          reply = diagnosedRisk.message
        }
        const settings = {
          context: {
            total_classes: totalClasses,
            required_attendance_rate: requiredAttendanceRate / 100,
            remaining_absence_allowance: absenceAllowance,
            absent_classes: absentClasses,
            missed_assignments: missedAssignments,
            assignment_status: assignmentStatus,
            deadline: deadline ? `${deadlineMonth}月${deadlineDay}日 23:59` : null,
          },
        }
        let response: Response | null = null
        if (isEncouragementRequest && !attachment) {
          // 危険度は生成AIではなく、calculateRiskのルール判定を採用する。
        } else if (attachment) {
          const formData = new FormData()
          formData.append('user_id', 'demo-user')
          formData.append('message', trimmed)
          formData.append('user_settings', JSON.stringify(settings))
          formData.append('attachment', attachment)
          response = await fetch(`${apiUrl}/chat/with-file`, { method: 'POST', body: formData })
        } else {
          response = await fetch(`${apiUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'demo-user', message: trimmed, user_settings: settings }),
          })
        }
        if (response?.ok) {
          const data = await response.json() as { reply: string }
          reply = data.reply
        } else if (response && attachment) {
          const data = await response.json().catch(() => null) as { detail?: string } | null
          reply = `ファイルを読み込めませんでした。${data?.detail ? `（${data.detail}）` : '形式やサイズを確認して、もう一度試してね。'}`
        }
      } catch {
        // API未起動時も、ルールベースの案内でデモを継続する。
        if (attachment) reply = 'ファイルを読み込めませんでした。バックエンドの起動を確認して、もう一度試してね。'
      }
      setMessages((prev) => [...prev, { id: id + 1, role: 'assistant', text: reply }])
      setIsThinking(false)
      if (diagnosedRisk?.level === 3) triggerKatsu(diagnosedRisk)
    }, 350)
  }, [absenceAllowance, absentClasses, assignmentStatus, createReply, deadlineDay, deadlineMonth, missedAssignments, requiredAttendanceRate, totalClasses, triggerKatsu])

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

  // messagesが更新されるたびに、localStorageに保存する
  useEffect(() => {
    if (!topicId) return;
    localStorage.setItem(`chatHistory_${topicId}`, JSON.stringify(messages));
  }, [messages, topicId]);

  useEffect(() => {
    if (katsuStage === 'idle') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [katsuStage])

  useEffect(() => () => {
    if (katsuTimerRef.current !== null) window.clearTimeout(katsuTimerRef.current)
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim() && !selectedFile) return

    const message = selectedFile
      ? `${input.trim() || 'このファイルを確認して'}\n📎 ${selectedFile.name}`
      : input
    sendMessage(message, selectedFile ?? undefined)
    setInput('')
    setSelectedFile(null)
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const maximumSize = 10 * 1024 * 1024
    if (file.size > maximumSize) {
      setSelectedFile(null)
      setFileError('ファイルサイズは10MB以下にしてください。')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setFileError('')
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.includes('喝')) setShowStatus(true)
    sendMessage(suggestion)
  }

  const remainingAbsences = absenceAllowance - absentClasses
  const isAttendanceCritical = remainingAbsences <= 1
  const katsuCommitmentAction = isAttendanceCritical
    ? `次回以降の${topicName}に必ず出席する`
    : katsuResult?.action ?? ''
  const katsuFocusReason = isAttendanceCritical
    ? `欠席許容回数${absenceAllowance}回に対して、すでに${absentClasses}回欠席しています。あと${Math.max(0, remainingAbsences)}回しか休めません。これ以上の欠席は単位取得に直結する危険な状況です。`
    : katsuResult?.reason ?? ''

  const confirmCommitment = () => {
    if (!commitmentChecked || !katsuResult) return
    setKatsuStage('idle')
    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      text: `宣言、受け取ったよ。まずは **${katsuCommitmentAction}**。ここから一緒に巻き返そう！`,
    }])
  }

  const katsuHeadline = isAttendanceCritical
    ? `あと${Math.max(0, remainingAbsences)}回しか休めないよ！？`
    : missedAssignments >= 5
    ? `課題を${missedAssignments}回も出し忘れてるよ！？`
    : assignmentStatus !== 'submitted' && deadlineAtEndOfDay(deadlineMonth, deadlineDay) && deadlineAtEndOfDay(deadlineMonth, deadlineDay)!.getTime() - Date.now() <= 24 * 60 * 60 * 1000
      ? `${topicName}の課題、今日が締切だよ！？`
      : 'このままだと本当に落単するよ！？'

  return (
    <div className={`flex h-[720px] flex-col bg-white ${katsuStage === 'impact' ? 'katsu-screen-shake' : ''}`}>
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        {/* 戻るボタン: -1 を指定すると、一つ前のページ(チャット選択画面)に戻ります */}
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-700 hover:text-black" aria-label="戻る"><ArrowLeft className="h-6 w-6" /></button>
        {/* トピック名を表示するタイトル */}
        <div className="flex-1"><h1 className="text-xl font-medium text-zinc-900">{topicName}</h1></div>
        <Sparkles className="h-5 w-5 text-[#ff5d5d]" />
      </header>

      <div className="border-b border-zinc-200 bg-white px-4 py-2">
        <button onClick={() => setShowStatus((value) => !value)} className="flex w-full items-center justify-between text-sm font-medium text-zinc-600">
          ぽけ先輩による落単危険度診断
          <ChevronDown className={`h-4 w-4 transition ${showStatus ? 'rotate-180' : ''}`} />
        </button>
        {showStatus && (
          <div className="mt-3 grid grid-cols-2 gap-2 pb-2 text-xs">
            <label>授業回数<input type="number" min="1" value={totalClasses} onChange={(e) => setTotalClasses(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <label>必要出席率（自動計算）<input type="text" readOnly value={`${requiredAttendanceRate.toFixed(1)}%`} className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-2 text-zinc-600" /></label>
            <label>欠席許容回数<input type="number" min="0" max={Math.max(0, totalClasses)} value={absenceAllowance} onChange={(e) => setAbsenceAllowance(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <label>欠席回数<input type="number" min="0" value={absentClasses} onChange={(e) => setAbsentClasses(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <label>課題状況<select value={assignmentStatus} onChange={(e) => setAssignmentStatus(e.target.value as AssignmentStatus)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2"><option value="not_started">未着手</option><option value="in_progress">進行中</option><option value="submitted">提出済み</option></select></label>
            <label>課題提出忘れの回数<input type="number" min="0" value={missedAssignments} onChange={(e) => setMissedAssignments(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2" /></label>
            <fieldset className="col-span-2">
              <legend>直近の課題の締切</legend>
              <div className="mt-1 flex items-center gap-2">
                <label className="flex flex-1 items-center gap-1">
                  <input type="number" min="1" max="12" value={deadlineMonth} onChange={(e) => setDeadlineMonth(Number(e.target.value))} className="w-full rounded-lg border border-zinc-300 px-2 py-2" />
                  <span>月</span>
                </label>
                <label className="flex flex-1 items-center gap-1">
                  <input type="number" min="1" max="31" value={deadlineDay} onChange={(e) => setDeadlineDay(Number(e.target.value))} className="w-full rounded-lg border border-zinc-300 px-2 py-2" />
                  <span>日</span>
                </label>
              </div>
              {!deadlineAtEndOfDay(deadlineMonth, deadlineDay) && <p className="mt-1 text-red-600">正しい月日を入力してください。</p>}
            </fieldset>
            <button type="button" onClick={() => sendMessage('今の状況を判定して、喝を入れて！')} disabled={isThinking || !deadlineAtEndOfDay(deadlineMonth, deadlineDay)} className="col-span-2 mt-1 rounded-full bg-[#ff5d5d] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              決定
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-7">
        {messages.map((message) => message.role === 'assistant' ? (
          <div key={message.id} className="flex items-start gap-2">
            <img src={avatarUrl} alt="ぽけ先輩" className="mt-1 h-9 w-9 rounded-full bg-white object-contain" />
            <div className="max-w-[78%] rounded-2xl rounded-tl-sm border border-zinc-400 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-800">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="mb-2 mt-1 text-xl font-bold text-zinc-950">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 mt-1 text-lg font-bold text-zinc-950">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-1.5 mt-1 text-base font-bold text-zinc-950">{children}</h3>,
                  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-zinc-950">{children}</strong>,
                  em: ({ children }) => <em className="italic text-zinc-700">{children}</em>,
                  hr: () => <hr className="my-3 border-0 border-t border-zinc-300" />,
                  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
                  li: ({ children }) => <li className="pl-0.5">{children}</li>,
                  blockquote: ({ children }) => <blockquote className="my-2 border-l-3 border-rose-300 bg-rose-50 px-3 py-1 text-zinc-700">{children}</blockquote>,
                  code: ({ children }) => <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-rose-700">{children}</code>,
                  a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline">{children}</a>,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div key={message.id} className="flex justify-end"><div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#ffadb3] px-4 py-3 text-sm leading-relaxed text-zinc-900">{message.text}</div></div>
        ))}
        {isThinking && (
          <div className="flex items-start gap-2" role="status" aria-live="polite">
            <img src={avatarUrl} alt="ぽけ先輩" className="mt-1 h-9 w-9 rounded-full bg-white object-contain" />
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-500">
              <span>ぽけ先輩が考え中</span>
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-300 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-300 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-300" />
              </span>
            </div>
          </div>
        )}
        {messages.length === 1 && <div className="ml-10 flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} onClick={() => handleSuggestionClick(item)} disabled={isThinking} className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs text-zinc-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50">{item}</button>)}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-zinc-200 bg-white p-3">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <FileText className="h-5 w-5 shrink-0 text-[#ff5d5d]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800">{selectedFile.name}</p>
              <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={clearSelectedFile} className="rounded-full p-1 text-zinc-500 hover:bg-rose-100" aria-label="選択したファイルを削除">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {fileError && <p className="mb-2 px-2 text-xs text-red-600">{fileError}</p>}
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,image/*,audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isThinking} className="text-zinc-500 hover:text-[#ff5d5d] disabled:cursor-wait disabled:opacity-50" aria-label="ファイルを選択"><Plus className="h-6 w-6" /></button>
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isThinking} placeholder={isThinking ? 'ぽけ先輩が考え中…' : 'ぽけ先輩に話しかける'} className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-wait" />
          <button type="submit" disabled={isThinking || (!input.trim() && !selectedFile)} className="rounded-full bg-[#ff5d5d] p-2 text-white disabled:cursor-not-allowed disabled:bg-zinc-300" aria-label="送信"><Send className="h-4 w-4" /></button>
        </div>
      </form>

      {katsuStage === 'impact' && (
        <div className="katsu-impact-overlay" role="alert" aria-live="assertive">
          <p className="katsu-impact-label">喝</p>
          <p className="katsu-impact-headline">{katsuHeadline}</p>
        </div>
      )}

      {katsuStage === 'commitment' && katsuResult && (
        <div className="katsu-lock-overlay" role="alertdialog" aria-modal="true" aria-labelledby="katsu-title">
          <div className="katsu-lock-card">
            <p className="katsu-lock-kicker">既読スルー禁止</p>
            <h2 id="katsu-title">まだ間に合う。<br />今ここで決めよう。</h2>
            <p className="katsu-lock-reason">{katsuFocusReason}</p>
            <label className="katsu-commitment-check">
              <input type="checkbox" checked={commitmentChecked} onChange={(event) => setCommitmentChecked(event.target.checked)} />
              <span>今から「{katsuCommitmentAction}」</span>
            </label>
            <button type="button" disabled={!commitmentChecked} onClick={confirmCommitment} className="katsu-commitment-button">
              行動を開始する
            </button>
            <p className="katsu-lock-note">チェックするまで、この画面は閉じられません。</p>
          </div>
        </div>
      )}
    </div>
  )
}
