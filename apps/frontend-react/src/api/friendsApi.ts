import axiosClient from './axiosClient'
import type { Friend, FriendRequest, UserSearchResult, UserSummary } from '../types/api'

export async function getMe() {
  const { data } = await axiosClient.get<UserSummary>('/api/users/me')
  return data
}

export async function searchUsers(tag: string) {
  const { data } = await axiosClient.get<UserSearchResult[]>('/api/users/search', { params: { tag } })
  return data
}

export async function getFriends() {
  const { data } = await axiosClient.get<Friend[]>('/api/friends')
  return data
}

export async function getFriendRequests() {
  const { data } = await axiosClient.get<FriendRequest[]>('/api/friends/requests')
  return data
}

export async function sendFriendRequest(uniqueTag: string) {
  await axiosClient.post('/api/friends/request', { uniqueTag })
}

export async function respondToFriendRequest(requestId: string, action: 'accept' | 'reject') {
  await axiosClient.post('/api/friends/respond', { requestId, action })
}
