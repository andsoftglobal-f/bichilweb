'use client'

import { useEffect, useState, useCallback } from 'react'
import { PlusIcon, KeyIcon } from '@heroicons/react/24/outline'
import AdminLayout from '@/components/AdminLayout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { Input, Select, Checkbox, Button, PageHeader, StatusBadge, FormActions } from '@/components/FormElements'
import { useAuth } from '@/contexts/AuthContext'
import { listUsers, createUser, updateUser, setUserPassword } from '@/actions/users'
import { listRoles } from '@/actions/roles'
import type { AdminUser, Role } from '@/types/auth'

const emptyForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  group_ids: [] as number[],
  is_active: true,
}

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [passwordModalUser, setPasswordModalUser] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([listUsers(), listRoles()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch {
      // Non-superusers get 403 here — handled by the guard below.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser?.is_superuser) load()
  }, [currentUser, load])

  const openCreate = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (u: AdminUser) => {
    setEditingUser(u)
    setForm({
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      password: '',
      group_ids: u.groups.map((g) => g.id),
      is_active: u.is_active,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          is_active: form.is_active,
          group_ids: form.group_ids,
        })
      } else {
        await createUser(form)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  // Deactivating a user is done via the edit modal's "Идэвхтэй" checkbox
  // above (handleSubmit already sends is_active) — no separate action needed.

  const submitPassword = async () => {
    if (!passwordModalUser) return
    try {
      await setUserPassword(passwordModalUser.id, newPassword)
      setPasswordModalUser(null)
      setNewPassword('')
    } catch {
      alert('Нууц үг тохируулахад алдаа гарлаа.')
    }
  }

  if (!authLoading && !currentUser?.is_superuser) {
    return (
      <AdminLayout title="Хэрэглэгчид">
        <div className="card p-8 text-center text-gray-500">
          Энэ хэсэгт зөвхөн Super Admin хандах эрхтэй.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Хэрэглэгчид">
      <PageHeader
        title="Хэрэглэгчийн удирдлага"
        description="Админ панелд нэвтрэх хэрэглэгч үүсгэх, эрх олгох, идэвхгүй болгох"
        action={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
            Шинэ хэрэглэгч
          </Button>
        }
      />

      <DataTable<AdminUser>
        loading={loading}
        data={users}
        columns={[
          { key: 'username', label: 'Нэвтрэх нэр' },
          { key: 'email', label: 'И-мэйл' },
          { key: 'role_label', label: 'Эрх' },
          {
            key: 'is_active',
            label: 'Төлөв',
            render: (u) => <StatusBadge active={u.is_active} />,
          },
          {
            key: 'must_change_password',
            label: 'Нууц үг',
            render: (u) => (u.must_change_password ? 'Анхны нэвтрэлтэд солино' : '—'),
          },
        ]}
        onEdit={openEdit}
        onView={(u) => {
          setPasswordModalUser(u)
          setNewPassword('')
        }}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Хэрэглэгч засах' : 'Шинэ хэрэглэгч'}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <Input
            label="Нэвтрэх нэр"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            disabled={!!editingUser}
            required
          />
          <Input
            label="И-мэйл"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Нэр"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              label="Овог"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          {!editingUser && (
            <Input
              label="Нууц үг"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helper="Хэрэглэгч анх нэвтрэхдээ нууц үгээ солих шаардлагатай."
              required
            />
          )}
          <Select
            label="Эрх (Role)"
            value={form.group_ids[0] ?? ''}
            onChange={(e) => setForm({ ...form, group_ids: e.target.value ? [Number(e.target.value)] : [] })}
            options={[{ value: '', label: '— Сонгох —' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
          />
          <Checkbox
            label="Идэвхтэй"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} submitText="Хадгалах" />
        </form>
      </Modal>

      <Modal isOpen={!!passwordModalUser} onClose={() => setPasswordModalUser(null)} title="Нууц үг тохируулах" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {passwordModalUser?.username} хэрэглэгчийн нууц үгийг шинээр тохируулна. Хэрэглэгч дараагийн
            нэвтрэлтдээ үүнийг солих шаардлагатай болно.
          </p>
          <Input
            label="Шинэ нууц үг"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setPasswordModalUser(null)}>Цуцлах</Button>
            <Button icon={<KeyIcon className="h-4 w-4" />} onClick={submitPassword} disabled={!newPassword}>
              Тохируулах
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
