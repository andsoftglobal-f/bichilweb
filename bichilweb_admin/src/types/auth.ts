/**
 * Auth / RBAC DTOs shared between the actions layer (src/actions) and the
 * pages that render them. Mirrors the shapes returned by app.accounts on
 * the Django backend (see bichilweb_backend/app/accounts/serializers.py).
 */

export interface Role {
  id: number
  name: string
}

export interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
}

export interface RoleDetail extends Role {
  permissions: Permission[]
  user_count: number
}

export interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser: boolean
  role_label: string
  groups: Role[]
  must_change_password: boolean
  last_login: string | null
}

export interface CreateUserInput {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  group_ids: number[]
  is_active: boolean
}

export interface UpdateUserInput {
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  group_ids: number[]
}

export interface UpsertRoleInput {
  name: string
  permission_ids: number[]
}

export interface CurrentUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
  groups: Role[]
  permissions: string[]
  must_change_password: boolean
}
