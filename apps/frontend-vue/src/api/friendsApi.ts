import { http } from './http'
import type { Friend, FriendRequest, UserSearchResult, UserSummary } from '../types/api'

export async function getMe() {
  const { data } = await http.get<UserSummary>('/api/users/me')
  return data
}

export async function searchUsers(tag: string) {
  const { data } = await http.get<UserSearchResult[]>('/api/users/search', { params: { tag } })
  return data
}

export async function getFriends() {
  const { data } = await http.get<Friend[]>('/api/friends')
  return data
}

export async function getFriendRequests() {
  const { data } = await http.get<FriendRequest[]>('/api/friends/requests')
  return data
}

export async function sendFriendRequest(uniqueTag: string) {
  await http.post('/api/friends/request', { uniqueTag })
}

export async function respondToFriendRequest(requestId: string, action: 'accept' | 'reject') {
  await http.post('/api/friends/respond', { requestId, action })
}
