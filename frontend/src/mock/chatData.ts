export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
}


// 曜日ごとの授業リスト
export const weeklySchedule = {
  monday: [
    { id: 'class-mon-1', name: '線形代数' },
    { id: 'class-mon-2', name: 'プログラミング基礎' },
  ],
  tuesday: [
    { id: 'class-tue-1', name: '情報理論' },
  ],
  wednesday: [
    { id: 'class-wed-1', name: '微分積分学' },
    { id: 'class-wed-2', name: 'データ構造とアルゴリズム' },
  ],
  thursday: [
    { id: 'class-thu-1', name: '統計学' },
  ],
  friday: [
    { id: 'class-fri-1', name: '人工知能' },
  ],
};

// その他の相談トピック
type Topic = {
  id: string;
  name: string;
};

export const otherTopics: Topic[] = [
  { id: 'registration', name: '履修登録について相談' },
  { id: 'motivation', name: '喝を入れて' },
];

// 曜日を日本語と英語で対応させるための定義
export const dayMap: { [key: string]: string } = {
  monday: '月',
  tuesday: '火',
  wednesday: '水',
  thursday: '木',
  friday: '金',
};

// 曜日の順序を定義
export const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];