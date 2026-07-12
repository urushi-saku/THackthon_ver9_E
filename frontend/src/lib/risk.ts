export type RiskLevel = 0 | 1 | 2 | 3

export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted'

export type CourseRiskInput = {
  totalClasses: number
  requiredAttendanceRate: number
  remainingAbsenceAllowance: number
  missedAssignments: number
  deadline?: Date
  assignmentStatus: AssignmentStatus
}

export type RiskResult = {
  level: RiskLevel
  label: string
  reason: string
  action: string
  message: string
}

const labels: Record<RiskLevel, string> = {
  0: '安全',
  1: '少し注意',
  2: '危険',
  3: '非常に危険',
}

type RiskFactor = {
  title: string
  level: RiskLevel
  reason: string
  action: string
}

function createCompositeResult(factors: RiskFactor[]): RiskResult {
  const sortedFactors = [...factors].sort((a, b) => b.level - a.level)
  const primary = sortedFactors[0]
  const level = primary.level
  const endings: Record<RiskLevel, string> = {
    0: 'この調子で続けよう！',
    1: '早めに動けば大丈夫！',
    2: '今ならまだ間に合う！',
    3: '一人で抱えず、今すぐ動こう。',
  }
  const details = sortedFactors
    .map((factor, index) => `${index + 1}. **レベル${factor.level}：${factor.title}**\n   ${factor.reason}`)
    .join('\n')

  return {
    level,
    label: labels[level],
    reason: sortedFactors.map((factor) => factor.reason).join(' '),
    action: primary.action,
    message: `### 総合診断：レベル${level}（${labels[level]}）\n\n危険な要素から順に確認するね。\n\n${details}\n\n---\n\n**まずやること：** ${primary.action}。\n\n${endings[level]}`,
  }
}

export function calculateRisk(input: CourseRiskInput, now = new Date()): RiskResult {
  const totalClasses = Math.max(1, Math.floor(input.totalClasses))
  const attendanceRate = Math.min(1, Math.max(0, input.requiredAttendanceRate))
  const remainingAbsences = Math.min(totalClasses, Math.max(0, Math.floor(input.remainingAbsenceAllowance)))
  const missedAssignments = Math.max(0, Math.floor(input.missedAssignments))
  const factors: RiskFactor[] = []

  // 各項目を必ず評価し、最後に危険度順へ並べる。
  if (input.deadline && input.assignmentStatus !== 'submitted') {
    const hoursRemaining = (input.deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    const deadlineLabel = `${input.deadline.getMonth() + 1}月${input.deadline.getDate()}日23:59`

    if (hoursRemaining < 0) {
      factors.push({ title: '直近の課題', level: 3, reason: `締切は${deadlineLabel}で、すでに超過しています。課題状況は「${input.assignmentStatus === 'not_started' ? '未着手' : '進行中'}」です。`, action: '提出可能か確認し、すぐ担当教員へ相談しよう' })
    } else if (hoursRemaining <= 24) {
      factors.push({ title: '直近の課題', level: 3, reason: `締切は${deadlineLabel}です。課題状況は「${input.assignmentStatus === 'not_started' ? '未着手' : '進行中'}」なので、最優先で取り組む必要があります。`, action: '今すぐ課題を開いて、提出までの作業を始めよう' })
    } else if (hoursRemaining <= 72) {
      const action = input.assignmentStatus === 'not_started'
        ? '今日中に資料を開いて見出しを作ろう'
        : '今日中に次の作業を1つ終わらせよう'
      factors.push({ title: '直近の課題', level: 2, reason: `締切は${deadlineLabel}で3日以内です。課題状況は「${input.assignmentStatus === 'not_started' ? '未着手' : '進行中'}」です。`, action })
    } else {
      factors.push({ title: '直近の課題', level: 0, reason: `締切は${deadlineLabel}です。課題状況は「${input.assignmentStatus === 'not_started' ? '未着手' : '進行中'}」で、締切まで3日より長くあります。`, action: '余裕があるうちに少しずつ進めよう' })
    }
  } else if (input.assignmentStatus === 'submitted') {
    factors.push({ title: '直近の課題', level: 0, reason: '課題状況は「提出済み」です。締切に関する危険はありません。', action: '次の課題を確認しよう' })
  } else {
    factors.push({ title: '直近の課題', level: 1, reason: '課題の締切が設定されていません。課題状況を確認する必要があります。', action: '直近の締切を確認して登録しよう' })
  }

  if (missedAssignments >= 5) {
    factors.push({ title: '課題提出忘れ', level: 3, reason: `提出忘れが${missedAssignments}回あり、単位取得が非常に危険です。`, action: '未提出課題を確認し、担当教員へすぐ相談しよう' })
  } else if (missedAssignments >= 3) {
    factors.push({ title: '課題提出忘れ', level: 2, reason: `提出忘れが${missedAssignments}回あります。`, action: '未提出課題を一覧にして、提出できるものから取り組もう' })
  } else if (missedAssignments >= 1) {
    factors.push({ title: '課題提出忘れ', level: 1, reason: `提出忘れが${missedAssignments}回あります。`, action: '次の締切をカレンダーに登録しよう' })
  } else {
    factors.push({ title: '課題提出忘れ', level: 0, reason: '提出忘れは0回です。', action: '提出できている状態を維持しよう' })
  }

  const attendanceSummary = `全${totalClasses}回、必要出席率${(attendanceRate * 100).toFixed(1)}%、欠席許容回数はあと${remainingAbsences}回です。`
  if (remainingAbsences === 0) {
    factors.push({ title: '出席要件', level: 3, reason: `${attendanceSummary}これ以上欠席できません。`, action: '次回の講義に必ず出席しよう' })
  } else if (remainingAbsences === 1) {
    factors.push({ title: '出席要件', level: 2, reason: attendanceSummary, action: '次回以降の講義を優先して出席しよう' })
  } else if (remainingAbsences === 2) {
    factors.push({ title: '出席要件', level: 1, reason: attendanceSummary, action: '今後の講義日を予定に登録しよう' })
  } else {
    factors.push({ title: '出席要件', level: 0, reason: attendanceSummary, action: '今の出席ペースを維持しよう' })
  }

  return createCompositeResult(factors)
}
