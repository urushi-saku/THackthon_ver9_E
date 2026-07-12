export type RiskLevel = 0 | 1 | 2 | 3

export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted'

export type CourseRiskInput = {
  totalClasses: number
  requiredAttendanceRate: number
  absentClasses: number
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

function createResult(level: RiskLevel, reason: string, action: string): RiskResult {
  const openings: Record<RiskLevel, string> = {
    0: '順調だね！',
    1: 'ちょっと気をつけよう。',
    2: 'かなり危ないよ。',
    3: '本当に危ない！',
  }
  const endings: Record<RiskLevel, string> = {
    0: 'この調子で続けよう！',
    1: '早めに動けば大丈夫！',
    2: '今ならまだ間に合う！',
    3: '一人で抱えず、今すぐ動こう。',
  }

  return {
    level,
    label: labels[level],
    reason,
    action,
    message: `${openings[level]}${reason} ${action}。${endings[level]}`,
  }
}

export function calculateRisk(input: CourseRiskInput, now = new Date()): RiskResult {
  const totalClasses = Math.max(1, Math.floor(input.totalClasses))
  const attendanceRate = Math.min(1, Math.max(0, input.requiredAttendanceRate))
  const absentClasses = Math.max(0, Math.floor(input.absentClasses))
  const requiredAttendance = Math.ceil(totalClasses * attendanceRate)
  const maximumAbsences = totalClasses - requiredAttendance
  const remainingAbsences = maximumAbsences - absentClasses

  // 出席要件は取り返せない可能性があるため、ほかの条件より優先する。
  if (remainingAbsences < 0) {
    return createResult(
      3,
      '現在の欠席回数では、出席要件を満たせない可能性があります。',
      '担当教員や学生支援窓口へ相談しよう',
    )
  }
  if (remainingAbsences === 0) {
    return createResult(
      3,
      'これ以上欠席すると、出席要件を満たせなくなる可能性があります。',
      '次回の講義に必ず出席しよう',
    )
  }
  if (remainingAbsences === 1) {
    return createResult(
      2,
      '欠席できる回数が、あと1回しかありません。',
      '次回以降の講義を優先して出席しよう',
    )
  }
  if (remainingAbsences === 2) {
    return createResult(
      1,
      '欠席できる回数は、あと2回です。',
      '今後の講義日を予定に登録しよう',
    )
  }

  if (input.deadline && input.assignmentStatus !== 'submitted') {
    const hoursRemaining = (input.deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursRemaining < 0) {
      return createResult(
        3,
        '課題の提出期限を過ぎています。',
        '提出可能か確認し、すぐ担当教員へ相談しよう',
      )
    }
    if (hoursRemaining <= 24) {
      return createResult(2, '課題の締切まで24時間を切っています。', '今から30分だけ課題を進めよう')
    }
    if (hoursRemaining <= 72) {
      const action = input.assignmentStatus === 'not_started'
        ? '今日中に資料を開いて見出しを作ろう'
        : '今日中に次の作業を1つ終わらせよう'
      return createResult(1, '課題の締切まで3日以内です。', action)
    }
  }

  return createResult(0, '現在、大きな単位取得リスクはありません。', '今のペースを維持しよう')
}
