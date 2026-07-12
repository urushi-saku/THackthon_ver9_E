import { FormEvent, useState } from 'react'
import { BookOpenText, Diamond, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()
  const [quickInput, setQuickInput] = useState('')

  const handleActionClick = (action: string) => {
    console.log('action click:', action)
    if (action === 'チャットで相談') {
      navigate('/chat/select')
    }
  }

  const handleQuickSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log('quick submit:', quickInput)
    setQuickInput('')
  }

  return (
    <>
      <header className="border-b border-zinc-300 py-3 text-center text-2xl font-bold text-[#ff5d5d]">
        ぽけ先輩
      </header>
      <div className="p-5 sm:p-7">
        <img
          src="https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=500&q=80"
          alt="ぽけ先輩"
          className="mx-auto h-40 w-40 rounded-full object-cover"
        />
        <p className="mt-3 text-center text-3xl font-bold text-zinc-800">ぽけ先輩</p>

        <div className="relative mt-5 rounded-2xl border border-zinc-500 bg-[#efefef] px-4 py-3 text-3xl leading-tight text-zinc-800 sm:text-[36px]">
          <div className="absolute -top-3 left-7 h-5 w-5 rotate-45 border-l border-t border-zinc-500 bg-[#efefef]" />
          <p className="relative">
            📢 テストまであと5日！
            <br />
            この講義は〇〇章からの出題が多いみたい。今ならまだ間に合う！
          </p>
        </div>

        <h2 className="mt-6 text-3xl font-bold text-zinc-900 sm:text-[32px]">何について相談する？</h2>
        <div className="mt-4 space-y-3">
          <button
            onClick={() => handleActionClick('チャットで相談')}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ff5d5d] bg-white px-4 py-3 text-3xl font-bold text-zinc-900 transition hover:bg-rose-50 sm:text-[44px]"
          >
            <MessageCircle className="h-8 w-8 text-rose-300" />
            チャットで相談
          </button>
          <button
            onClick={() => handleActionClick('講義の要約')}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ff5d5d] bg-white px-4 py-3 text-3xl font-bold text-zinc-900 transition hover:bg-rose-50 sm:text-[44px]"
          >
            <BookOpenText className="h-8 w-8 text-rose-300" />
            講義の要約
          </button>
          <button
            onClick={() => handleActionClick('おすすめ')}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#ff5d5d] bg-white px-4 py-3 text-3xl font-bold text-zinc-900 transition hover:bg-rose-50 sm:text-[44px]"
          >
            <Diamond className="h-8 w-8 text-rose-300" />
            おすすめ
          </button>
        </div>

        <form onSubmit={handleQuickSubmit} className="mt-4">
          <label className="mb-1 block text-lg font-semibold text-zinc-700">ひとこと相談</label>
          <div className="flex gap-2">
            <input
              value={quickInput}
              onChange={(event) => setQuickInput(event.target.value)}
              placeholder="例: どこから復習すべき？"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-rose-300"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#ff5d5d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ff4a4a]"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
