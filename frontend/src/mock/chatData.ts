export type ChatTopic = {
  id: string
  label: string
}

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
}

export type ChatResource = {
  id: number
  label: string
}

export const chatTopics: ChatTopic[] = [
  { id: 'risk', label: '喝を入れて' },
  { id: 'lecture', label: '授業について' },
  { id: 'registration', label: '履修登録について' },
]

export const mockMessagesByTopic: Record<string, ChatMessage[]> = {
  risk: [
    {
      id: 1,
      role: 'assistant',
      text: '出席と課題の状況を教えて。危険度を確認して、今やることを1つ決めよう！',
    },
  ],
  lecture: [
    { id: 1, role: 'assistant', text: 'テキストテキストテキスト' },
    { id: 2, role: 'user', text: 'テキストテキストテキストテキ' },
    {
      id: 3,
      role: 'assistant',
      text: 'テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト',
    },
  ],
  registration: [
    { id: 1, role: 'assistant', text: '履修登録の相談ですね。希望の曜日や時間帯を教えてください。' },
    { id: 2, role: 'user', text: '火曜3限は空けたいです。' },
    { id: 3, role: 'assistant', text: '了解です。必修との重複がない候補を確認します。' },
  ],
}

export const mockResourcesByTopic: Record<string, ChatResource[]> = {
  risk: [],
  lecture: [{ id: 1, label: '講義資料' }],
  registration: [{ id: 1, label: '履修登録ガイド' }],
}
