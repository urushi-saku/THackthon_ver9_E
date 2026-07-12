import { FormEvent, useState } from 'react'
import { ArrowLeft, Save, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { profileStorageKey, UserProfile } from '../lib/profile'

export function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const currentYear = new Date().getFullYear()
  const savedProfile = currentUser
    ? localStorage.getItem(profileStorageKey(currentUser.uid))
    : null
  const initialProfile = savedProfile ? JSON.parse(savedProfile) as UserProfile : null

  const [name, setName] = useState(initialProfile?.name ?? currentUser?.displayName ?? '')
  const [university, setUniversity] = useState(initialProfile?.university ?? '')
  const [department, setDepartment] = useState(initialProfile?.department ?? '')
  const [admissionYear, setAdmissionYear] = useState(initialProfile?.admissionYear ?? currentYear)
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) return

    const profile: UserProfile = {
      name: name.trim(),
      university: university.trim(),
      department: department.trim(),
      admissionYear,
    }
    localStorage.setItem(profileStorageKey(currentUser.uid), JSON.stringify(profile))
    setSaved(true)
    window.setTimeout(() => navigate('/', { replace: true }), 450)
  }

  return (
    <div className="min-h-[720px] bg-white">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="p-1 text-zinc-600" aria-label="戻る">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <UserRound className="h-6 w-6 text-[#ff6b8b]" />
        <h1 className="text-lg font-bold text-zinc-900">プロフィール設定</h1>
      </header>

      <main className="px-6 py-8">
        <div className="mb-7 text-center">
          <img src="/poke-senpai.jpg" alt="ぽけ先輩" className="mx-auto h-24 w-24 rounded-full bg-white object-contain" />
          <p className="mt-3 text-sm text-zinc-500">あなたに合ったアドバイスのために教えてね。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-bold text-zinc-700">
            名前
            <input required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="例：山田 太郎" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-normal outline-none focus:border-[#ff6b8b]" />
          </label>
          <label className="block text-sm font-bold text-zinc-700">
            大学名
            <input required maxLength={100} value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="例：〇〇大学" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-normal outline-none focus:border-[#ff6b8b]" />
          </label>
          <label className="block text-sm font-bold text-zinc-700">
            学部・学科名
            <input required maxLength={100} value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="例：情報学部 情報システム学科" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-normal outline-none focus:border-[#ff6b8b]" />
          </label>
          <label className="block text-sm font-bold text-zinc-700">
            入学年度
            <input required type="number" min="1950" max={currentYear + 1} value={admissionYear} onChange={(event) => setAdmissionYear(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-normal outline-none focus:border-[#ff6b8b]" />
          </label>

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ff6b8b] px-5 py-3.5 font-bold text-white transition hover:bg-[#ff4f75]">
            <Save className="h-5 w-5" />
            {saved ? '保存しました' : 'プロフィールを保存'}
          </button>
        </form>
      </main>
    </div>
  )
}
