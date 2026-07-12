import { Component, ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ChatPage } from './pages/ChatPage'
import { HomePage } from './pages/HomePage'
import { SummaryPage } from './pages/SummaryPage'

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('App error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-zinc-700">
          画面の表示でエラーが発生しました。再読み込みしてください。
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <div className="min-h-screen bg-[#e6e6e6] p-2 sm:p-6">
          <div className="mx-auto w-full max-w-[420px] overflow-hidden border-4 border-[#1b9af7] bg-[#efefef] shadow-sm">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/chat/select" element={<Navigate to="/chat" replace />} />
              <Route path="/chat/:topicId" element={<Navigate to="/chat" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </ErrorBoundary>
    </HashRouter>
  )
}

export default App
