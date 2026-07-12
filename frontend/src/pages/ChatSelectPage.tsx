// アイコンとページ遷移のためのフックをインポート
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
// チャットのトピック一覧データをインポート
import { chatTopics } from '../mock/chatData'

/**
 * ChatSelectPage: 相談したいチャットのトピックを選択するページコンポーネント。
 */
export function ChatSelectPage() {
  // useNavigateフックを使って、ページ遷移を制御する関数を取得
  const navigate = useNavigate()

  return (
    <>
      {/* ヘッダー部分 */}
      <header className="flex items-center gap-3 border-b border-zinc-300 bg-[#dfdfdf] px-4 py-3">
        {/* 戻るボタン */}
        <button
          onClick={() => {
            console.log('back click')
            navigate('/') // ホームページに戻る
          }}
          className="rounded-md p-1 text-zinc-700 transition hover:bg-zinc-200"
        >
          <ArrowLeft className="h-7 w-7" />
        </button>
        {/* ページタイトルアイコン */}
        <MessageCircle className="h-9 w-9 fill-rose-200 text-rose-200" />
        {/* ページタイトル */}
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-[44px]">チャットで相談</h1>
      </header>

      {/* メインコンテンツ部分 */}
      <div className="min-h-[620px] px-7 py-12">
        <div className="space-y-10">
          {/* chatTopics配列から各トピックをボタンとして描画 */}
          {chatTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                console.log('chat category:', topic.label)
                navigate(`/chat/${topic.id}`) // 選択したトピックのチャットページに遷移
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
