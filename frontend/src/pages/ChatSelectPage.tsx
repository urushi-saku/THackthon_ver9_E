// Reactのフック、アイコン、ページ遷移のためのフックをインポート
import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// 新しく定義したチャットデータをインポート
import { weeklySchedule, otherTopics, dayMap, dayOrder } from '../mock/chatData';
// このコンポーネント専用のCSSファイルをインポート
import './ChatSelectPage.css';

/**
 * ChatSelectPage: 相談したいチャットのトピックを選択するページコンポーネント。
 * 曜日ごとの授業と、その他のトピックを選択できる。
 */
export function ChatSelectPage() {
  // useNavigateフックを使って、ページ遷移を制御する関数を取得
  const navigate = useNavigate();
  // 現在選択されている曜日タブを管理するstate
  const [activeTab, setActiveTab] = useState('monday');

  return (
    <div className="chat-select-page">
      {/* ヘッダー部分 */}
      <header className="chat-select-header">
        {/* 戻るボタン */}
        <button
          onClick={() => navigate('/')} // ホームページに戻る
          className="back-button"
        >
          <ArrowLeft size={24} />
        </button>
        {/* ページタイトルアイコン */}
        <MessageCircle size={28} className="title-icon" />
        {/* ページタイトル */}
        <h1>チャットで相談</h1>
      </header>

      {/* メインコンテンツ部分 */}
      <main className="chat-select-main">
        {/* 曜日選択タブ */}
        <div className="day-tabs">
          {dayOrder.map((day) => (
            <button
              key={day}
              className={`day-tab ${activeTab === day ? 'active' : ''}`}
              onClick={() => setActiveTab(day)}
            >
              {dayMap[day]}
            </button>
          ))}
        </div>

        {/* トピックリスト */}
        <div className="topic-list">
          {/* 選択された曜日の授業リスト */}
          <div className="topic-group">
            <h2 className="topic-group-title">{dayMap[activeTab]}曜日の授業</h2>
            <div className="topic-buttons">
              {(weeklySchedule[activeTab as keyof typeof weeklySchedule] || []).map((lecture) => (
                <button key={lecture.id} onClick={() => navigate(`/chat/${lecture.id}`)} className="topic-button">
                  {lecture.name}
                </button>
              ))}
            </div>
          </div>

          {/* その他のトピック */}
          <div className="topic-group">
            <h2 className="topic-group-title">その他</h2>
            <div className="topic-buttons">
              {otherTopics.map((topic) => (
                <button key={topic.id} onClick={() => navigate(`/chat/${topic.id}`)} className="topic-button">
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
