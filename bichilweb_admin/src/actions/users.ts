/**
 * User management actions — thin, typed wrappers around the accounts API
 * (see bichilweb_backend/app/accounts). Pages should call these instead of
 * inlining axiosInstance.get/post calls, per the report's "actions/service
 * files" requirement: business logic (the shape of a request, error
 * unwrapping) lives here once, not duplicated per page.
 */

import { axiosInstance } from '@/lib/axios'
import { isAxiosError } from 'axios'
import type { AdminUser, CreateUserInput, UpdateUserInput } from '@/types/auth'

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = isAxiosError(err) ? err.response?.data : undefined
  if (data && typeof data === 'object') {
    const joined = Object.values(data).flat().join(' ')
    if (joined) return joined
  }
  return fallback
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await axiosInstance.get<AdminUser[]>('/accounts/users/')
  return res.data
}

export async function createUser(input: CreateUserInput): Promise<AdminUser> {
  try {
    const res = await axiosInstance.post<AdminUser>('/accounts/users/', input)
    return res.data
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Хэрэглэгч үүсгэхэд алдаа гарлаа.'))
  }
}

export async function updateUser(id: number, input: Partial<UpdateUserInput>): Promise<AdminUser> {
  try {
    const res = await axiosInstance.patch<AdminUser>(`/accounts/users/${id}/`, input)
    return res.data
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Хэрэглэгч шинэчлэхэд алдаа гарлаа.'))
  }
}

export async function setUserPassword(id: number, password: string): Promise<void> {
  try {
    await axiosInstance.post(`/accounts/users/${id}/set-password/`, { password })
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Нууц үг тохируулахад алдаа гарлаа.'))
  }
}
