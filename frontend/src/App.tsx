// Reactの基本的な機能と、ルーティングのためのコンポーネントをインポート
import { Component, ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
// 各ページのコンポーネントをインポート
import { ChatPage } from './pages/ChatPage'
import { ChatSelectPage } from './pages/ChatSelectPage'
import { SummaryPage } from './pages/SummaryPage'
import { SummaryResultPage } from './pages/SummaryResultPage'
import { Homepage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { AuthProvider, useAuth } from './AuthContext'

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

/**
 * アプリケーションのメインルーティングを管理するコンポーネント。
 * ログイン状態に応じて表示するページを切り替える。
 */
function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {currentUser ? (
        <>
          {/* ログイン済みの場合のルート */}
          <Route path="/" element={<Homepage />} />
          <Route path="/summary/result" element={<SummaryResultPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/chat/select" element={<ChatSelectPage />} />
          <Route path="/chat/:topicId" element={<ChatPage />} />
          {/* どのルートにも一致しない場合はホームページへ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          {/* 未ログインの場合のルート */}
          <Route path="/login" element={<LoginPage />} />
          {/* どのルートにも一致しない場合はログインページへ */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      {/* ErrorBoundaryでアプリケーション全体をラップし、どこかでエラーが起きてもキャッチできるようにします。 */}
      <ErrorBoundary>
        <AuthProvider>
          {/* アプリケーション全体の背景色とパディングを設定します。 */}
          <div className="min-h-dvh bg-[#e6e6e6] p-2 sm:p-6">
            {/* スマートフォン風の画面コンテナ。中央に配置され、最大幅が設定されています。 */}
            <div className="mx-auto w-full max-w-sm sm:max-w-md overflow-hidden border-4 border-[#1b9af7] bg-[#efefef] shadow-sm">
              <AppRoutes />
            </div>
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </HashRouter>
  )
}

export default App
