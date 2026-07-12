export type UserProfile = {
  name: string
  university: string
  department: string
  admissionYear: number
}

export function profileStorageKey(uid: string) {
  return `poke-senpai-profile:${uid}`
}
