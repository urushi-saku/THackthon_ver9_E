// ページ遷移のためのLinkコンポーネントと、アイコン表示のためのlucide-reactライブラリをインポート
import { Link } from 'react-router-dom';
import { MessageSquare, Book, Gem, Speaker } from 'lucide-react';
// このコンポーネント専用のCSSファイルをインポート
import './HomePage.css';

/**
 * Homepage: アプリケーションのメイン画面（トップページ）を表示するコンポーネント。
 */
const Homepage = () => {
  return (
    // home-screen: 画面全体のコンテナ
    <div className="home-screen">
      {/* home-header: 画面上部のヘッダー */}
      <header className="home-header">
        <h1 style={{ color: '#FF6B8B' }}>ぽけ先輩</h1>
      </header>

      {/* home-main-content: ヘッダー以下のメインコンテンツ領域 */}
      <main className="home-main-content">
        {/* profile-section: アバターと名前を表示するプロフィールセクション */}
        <section className="profile-section">
          <img
            src="/image_0.png"
            alt="ぽけ先輩アバター"
            // circle-avatarとlargeクラスで円形のアバター画像とサイズを指定
            className="circle-avatar large"
          />
          <p className="profile-name">ぽけ先輩</p>
        </section>

        {/* message-bubble: ぽけ先輩からのメッセージを表示する吹き出し */}
        <div className="message-bubble">
          <p>
            {/* Speakerアイコン */}
            <Speaker size={16} color="#888888" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            テストまであと5日！
          </p>
          <p>この講義は〇〇章からの出題</p>
          <p>が多いみたい。今ならまだ間に</p>
          <p>合う！</p>
        </div>

        {/* consult-prompt: ユーザーへの問いかけ */}
        <p className="consult-prompt">
          何について相談する？
        </p>

        {/* action-menu: ユーザーが選択できるアクションボタンのナビゲーション */}
        <nav className="action-menu">
          {/* rounded-card-button: 各アクションボタン */}
          {/* Link to=...: ボタンクリック時の遷移先を指定 */}
          <Link to="/chat/select" className="rounded-card-button">
            {/* MessageSquareアイコン */}
            <MessageSquare className="action-icon" color="#FF6B8B" fill="#FF6B8B" />
            <span className="action-text">チャットで相談</span>
          </Link>
          <Link to="/summary" className="rounded-card-button">
            {/* Bookアイコン */}
            <Book className="action-icon" color="#FF6B8B" />
            <span className="action-text">講義の要約</span>
          </Link>
          <Link to="/recommend" className="rounded-card-button">
            {/* Gemアイコン */}
            <Gem className="action-icon" color="#FF6B8B" fill="#FF6B8B" />
            <span className="action-text">おすすめ</span>
          </Link>
        </nav>
      </main>
    </div>
  );
};

// Homepageコンポーネントをエクスポート
export { Homepage };
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
