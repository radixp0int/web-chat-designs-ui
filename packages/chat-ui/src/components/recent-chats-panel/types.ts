import type { RecentChat } from '../../types'

export type RecentChatsPanelProps = {
  chats: RecentChat[]
  activeId: string
  onSelect: (id: string) => void
}
