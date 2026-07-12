import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { chatTopics } from '../mock/chatData'

export function ChatSelectPage() {
  const navigate = useNavigate()

  return (
    <>
      <header className="flex items-center gap-3 border-b border-zinc-300 bg-[#dfdfdf] px-4 py-3">
        <button
          onClick={() => {
            console.log('back click')
            navigate('/')
          }}
          className="rounded-md p-1 text-zinc-700 transition hover:bg-zinc-200"
        >
          <ArrowLeft className="h-7 w-7" />
        </button>
        <MessageCircle className="h-9 w-9 fill-rose-200 text-rose-200" />
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-[44px]">チャットで相談</h1>
      </header>

      <div className="min-h-[620px] px-7 py-12">
        <div className="space-y-10">
          {chatTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                console.log('chat category:', topic.label)
                navigate(`/chat/${topic.id}`)
              }}
              className="block w-full rounded-full border border-[#ff5d5d] bg-[#f5f5f5] px-4 py-3 text-4xl font-semibold text-zinc-900 transition hover:bg-rose-50 sm:text-[56px]"
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
