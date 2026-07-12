// Reactの基本的な機能と、ルーティングのためのコンポーネントをインポート
import { Component, ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
// 各ページのコンポーネントをインポート
import { ChatPage } from './pages/ChatPage'
import { ChatSelectPage } from './pages/ChatSelectPage'
import { Homepage } from './pages/HomePage'
import { SummaryPage } from './pages/SummaryPage'
import { SummaryResultPage } from './pages/SummaryResultPage'

// ErrorBoundaryコンポーネントのstateの型定義
type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * ErrorBoundary: アプリケーション内で発生したJavaScriptエラーをキャッチし、
 * 代替のUI（フォールバックUI）を表示するためのReactコンポーネント。
 * これにより、一部のコンポーネントでエラーが起きてもアプリ全体がクラッシュするのを防ぎます。
 */
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  // 子コンポーネントでエラーがスローされた後に呼び出され、stateを更新してエラーUIを表示させます。
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  // エラーがキャッチされたときに呼び出され、エラー情報をコンソールに出力します。
  componentDidCatch(error: unknown) {
    console.error('App error:', error)
  }

  render() {
    // stateのhasErrorがtrueの場合、エラーメッセージを表示します。
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-zinc-700">
          画面の表示でエラーが発生しました。再読み込みしてください。
        </div>
      )
    }
    // エラーがない場合は、子コンポーネントを通常通りレンダリングします。
    return this.props.children
  }
}

function App() {
  return (
    <HashRouter>
      {/* ErrorBoundaryでアプリケーション全体をラップし、どこかでエラーが起きてもキャッチできるようにします。 */}
      <ErrorBoundary>
        {/* アプリケーション全体の背景色とパディングを設定します。 */}
        <div className="min-h-dvh bg-[#e6e6e6] p-2 sm:p-6">
          {/* スマートフォン風の画面コンテナ。中央に配置され、最大幅が設定されています。 */}
          <div className="mx-auto w-full max-w-sm sm:max-w-md overflow-hidden border-4 border-[#1b9af7] bg-[#efefef] shadow-sm">
            {/* Routes: URLに応じて表示するコンポーネントを切り替えるためのコンテナです。 */}
            <Routes>
              {/* ルートパス ("/") にはHomepageコンポーネントを表示します。 */}
              <Route path="/" element={<Homepage />} />
              <Route path="/summary/result" element={<SummaryResultPage />} />
              {/* "/summary" パスにはSummaryPageコンポーネントを表示します。 */}
              <Route path="/summary" element={<SummaryPage />} />
              {/* "/chat/select" パスにはChatSelectPageコンポーネントを表示します。 */}
              <Route path="/chat/select" element={<ChatSelectPage />} />
              {/* "/chat/:topicId" パスにはChatPageコンポーネントを表示します。:topicIdは動的な値です。 */}
              <Route path="/chat/:topicId" element={<ChatPage />} />
              {/* 上記のいずれにも一致しないパスは、ルートパス("/")にリダイレクトします。 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </ErrorBoundary>
    </HashRouter>
  )
}

export default App
