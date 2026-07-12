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