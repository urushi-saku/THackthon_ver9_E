import { ChangeEvent, DragEvent, useState } from 'react'
import { ArrowLeft, FileUp, Mic, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './SummaryPage.css'

export function SummaryPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'select' | 'upload'>('select')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('PDFファイルを選択してください。')
      return
    }
    setError('')
    navigate('/summary/result', { state: { file } })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0] ?? null)
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFileSelect(event.dataTransfer.files?.[0] ?? null)
  }

  return (
    <div className="summary-page">
      <header className="summary-header">
        <button onClick={() => view === 'upload' ? setView('select') : navigate('/')} className="back-button" aria-label="戻る">
          <ArrowLeft size={24} />
        </button>
        <h2>講義の要約</h2>
      </header>

      <main className="summary-main">
        {view === 'select' ? (
          <div className="selection-view">
            <button onClick={() => setView('upload')} className="selection-button">
              <Upload className="selection-icon" />
              <span>PDFを選択</span>
            </button>
            <button onClick={() => alert('音声録音は準備中です！')} className="selection-button disabled">
              <Mic className="selection-icon" />
              <span>音声を録音</span>
            </button>
          </div>
        ) : (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label htmlFor="file-upload" className="file-upload-label">
              <FileUp size={48} />
              <p>ここにファイルをドラッグ＆ドロップ</p>
              <p>または</p>
              <p className="browse-button">ファイルを選択</p>
              <span className="file-info">（PDFファイルのみ）</span>
            </label>
            <input id="file-upload" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </main>
    </div>
  )
}
