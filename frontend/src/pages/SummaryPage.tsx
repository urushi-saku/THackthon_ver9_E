// Reactのフック、ルーター、アイコンをインポート
import { useState, ChangeEvent, DragEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileUp, Send, XCircle, FileText, Upload, Mic } from 'lucide-react';
// このコンポーネント専用のCSSファイルをインポート
import './SummaryPage.css';

/**
 * SummaryPage: 講義資料をアップロードして要約を依頼するページコンポーネント。
 * ファイル選択、送信確認、アップロード中の3つの状態を持ちます。
 */
export function SummaryPage() {
  // useNavigateフックを使って、ページ遷移を制御する関数を取得
  const navigate = useNavigate();
  // 'select' (選択画面) or 'upload' (アップロード画面) を管理するstate
  const [view, setView] = useState<'select' | 'upload'>('select');
  // 選択されたファイルを管理するためのstate
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // ドラッグ&ドロップ操作中かどうかを管理するためのstate
  const [isDragging, setIsDragging] = useState(false);
  // アップロード中かどうかを管理するためのstate
  const [isUploading, setIsUploading] = useState(false);
  // アップロードの進捗を管理するためのstate
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * ファイルが選択またはドロップされたときの処理。
   * @param file - 選択されたファイル
   */
  const handleFileSelect = (file: File | null) => {
    if (file) {
      // PDFファイルのみを受け付ける例（必要に応じて変更してください）
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setView('upload'); // ファイルが選択されたらアップロード画面に切り替え
      } else {
        alert('PDFファイルを選択してください。');
      }
    }
  };

  // ファイル選択inputの変更イベントハンドラ
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0] ?? null);
  };

  // ドラッグ開始イベントハンドラ
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // ドラッグ中のイベントハンドラ
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // デフォルトの動作（ファイルを開くなど）を防ぐ
    setIsDragging(true);
  };

  // ドラッグ終了イベントハンドラ
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // ドロップイベントハンドラ
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files?.[0] ?? null);
  };

  // 送信ボタンクリック時のハンドラ
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      console.log('送信するファイル:', selectedFile.name);

      // --- アップロード処理のシミュレーション ---
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const nextProgress = prev + 10;
          if (nextProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              alert(`${selectedFile.name} の要約が完了しました！`);
              navigate('/'); // 完了後、ホームページに遷移
            }, 500);
            return 100;
          }
          return nextProgress;
        });
      }, 200); // 0.2秒ごとに進捗を更新
    }
  };

  // キャンセルボタンクリック時のハンドラ
  const handleCancel = () => {
    setSelectedFile(null);
    setView('select'); // キャンセルしたら選択画面に戻る
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return
    navigate('/summary/result', { state: { file } })
  }

  return (
    <div className="summary-page">
      {/* ヘッダー部分 */}
      <header className="summary-header">
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeft size={24} />
        </button>
        <h2>講義の要約</h2>
      </header>

      {/* メインコンテンツ */}
      <main className="summary-main">
        {view === 'select' ? (
          // --- 種類選択画面 ---
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
          // --- アップロード関連画面 ---
          <>
            {isUploading ? (
              // --- アップロード中画面 ---
              <div className="uploading-view">
                <p>ファイルをアップロード中...</p>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>{uploadProgress}%</p>
              </div>
            ) : selectedFile ? (
              // --- 送信確認画面 ---
              <form className="confirmation-view" onSubmit={handleSubmit}>
                <FileText size={64} className="file-icon" />
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="button-group">
                  <button type="button" onClick={handleCancel} className="cancel-button">
                    <XCircle size={20} />
                    <span>キャンセル</span>
                  </button>
                  <button type="submit" className="submit-button">
                    <Send size={20} />
                    <span>送信</span>
                  </button>
                </div>
              </form>
            ) : (
              // --- ファイル選択画面 ---
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
                <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
