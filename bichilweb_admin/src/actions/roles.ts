/**
 * Role management actions — see src/actions/users.ts for the pattern this
 * follows.
 */

import { axiosInstance } from '@/lib/axios'
import { isAxiosError } from 'axios'
import type { Permission, RoleDetail, UpsertRoleInput } from '@/types/auth'

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = isAxiosError(err) ? err.response?.data : undefined
  if (data && typeof data === 'object') {
    const joined = Object.values(data).flat().join(' ')
    if (joined) return joined
  }
  return fallback
}

export async function listRoles(): Promise<RoleDetail[]> {
  const res = await axiosInstance.get<RoleDetail[]>('/accounts/roles/')
  return res.data
}

export async function listPermissions(): Promise<Permission[]> {
  const res = await axiosInstance.get<Permission[]>('/accounts/permissions/')
  return res.data
}

export async function createRole(input: UpsertRoleInput): Promise<RoleDetail> {
  try {
    const res = await axiosInstance.post<RoleDetail>('/accounts/roles/', input)
    return res.data
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Role үүсгэхэд алдаа гарлаа.'))
  }
}

export async function updateRole(id: number, input: UpsertRoleInput): Promise<RoleDetail> {
  try {
    const res = await axiosInstance.patch<RoleDetail>(`/accounts/roles/${id}/`, input)
    return res.data
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Role шинэчлэхэд алдаа гарлаа.'))
  }
}

export async function deleteRole(id: number): Promise<void> {
  try {
    await axiosInstance.delete(`/accounts/roles/${id}/`)
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Role устгахад алдаа гарлаа.'))
  }
}
