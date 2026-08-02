const AVATAR_LIST = [
  '🌸', '🌻', '🌺', '🐱', '🐰', '🦊', '🐼', '🌙', '⭐', '🍀',
  '🌈', '🦋', '🌷', '🌹', '🐶', '🐨', '🦁', '🐯', '🐸', '🐵',
  '🍄', '🌿', '🌊', '☀️', '🍓', '🍑', '🌼', '🐝', '🦄', '🐧',
]

export function getDeterministicAvatar(nickname: string): string {
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = ((hash << 5) - hash) + nickname.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_LIST[Math.abs(hash) % AVATAR_LIST.length]
}
