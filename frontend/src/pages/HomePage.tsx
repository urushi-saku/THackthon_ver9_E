import { BookOpen, Diamond, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[720px] bg-white px-7 pb-8">
      <header className="border-b border-zinc-200 py-3 text-center text-lg font-medium text-[#ff5d5d]">ぽけ先輩</header>

      <main className="pt-5">
        <img
          src="https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=500&q=80"
          alt="ぽけ先輩"
          className="mx-auto h-40 w-40 rounded-full object-cover"
        />
        <h1 className="mt-3 text-center text-base font-medium text-zinc-900">ぽけ先輩</h1>

        <div className="relative mt-5 rounded-2xl border border-zinc-500 bg-[#f7f7f7] px-5 py-4 text-base leading-snug text-zinc-900">
          <div className="absolute -top-3 left-7 h-5 w-5 rotate-45 border-l border-t border-zinc-500 bg-[#f7f7f7]" />
          <p className="relative">📢 テストまであと5日！<br />この講義は演習問題からの出題が多いみたい。今ならまだ間に合う！</p>
        </div>

        <h2 className="mt-8 text-base font-medium text-zinc-900">何について相談する？</h2>
        <div className="mt-3 space-y-3">
          <button onClick={() => navigate('/chat')} className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ff5d5d] bg-white px-4 py-3 text-2xl text-zinc-900 hover:bg-rose-50">
            <MessageCircle className="h-8 w-8 fill-rose-200 text-rose-200" />チャットで相談
          </button>
          <button onClick={() => navigate('/summary')} className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ff5d5d] bg-white px-4 py-3 text-2xl text-zinc-900 hover:bg-rose-50">
            <BookOpen className="h-8 w-8 text-[#ff5d5d]" />講義の要約
          </button>
          <button onClick={() => navigate('/chat', { state: { initialMessage: '今の私におすすめの勉強法を教えて' } })} className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ff5d5d] bg-white px-4 py-3 text-2xl text-zinc-900 hover:bg-rose-50">
            <Diamond className="h-7 w-7 fill-rose-200 text-rose-200" />おすすめ
          </button>
        </div>

        <p className="mt-7 text-center text-xs text-zinc-400">先輩の知恵を、ポケットに。</p>
      </main>
    </div>
  )
}
