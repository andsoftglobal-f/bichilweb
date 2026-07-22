'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import AdminLayout from '@/components/AdminLayout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { Input, Checkbox, Button, PageHeader, FormActions } from '@/components/FormElements'
import { useAuth } from '@/contexts/AuthContext'
import { listRoles, listPermissions, createRole, updateRole, deleteRole } from '@/actions/roles'
import type { Permission, RoleDetail } from '@/types/auth'

const ACTION_LABELS: Record<string, string> = {
  add: 'Нэмэх',
  change: 'Засах',
  delete: 'Устгах',
  view: 'Харах',
}

function actionFromCodename(codename: string): string {
  return codename.split('_')[0] || codename
}

export default function RolesPage() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const [roles, setRoles] = useState<RoleDetail[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleDetail | null>(null)
  const [name, setName] = useState('')
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesData, permsData] = await Promise.all([listRoles(), listPermissions()])
      setRoles(rolesData)
      setAllPermissions(permsData)
    } catch {
      // 403 for non-superusers — handled by the guard below.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser?.is_superuser) load()
  }, [currentUser, load])

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>()
    allPermissions.forEach((p) => {
      const list = groups.get(p.model) || []
      list.push(p)
      groups.set(p.model, list)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissions])

  const openCreate = () => {
    setEditingRole(null)
    setName('')
    setSelectedPermIds(new Set())
    setError('')
    setModalOpen(true)
  }

  const openEdit = (role: RoleDetail) => {
    setEditingRole(role)
    setName(role.name)
    setSelectedPermIds(new Set(role.permissions.map((p) => p.id)))
    setError('')
    setModalOpen(true)
  }

  const togglePerm = (id: number) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = { name, permission_ids: Array.from(selectedPermIds) }
      if (editingRole) {
        await updateRole(editingRole.id, payload)
      } else {
        await createRole(payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Хадгалахад алдаа гарлаа.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: RoleDetail) => {
    if (!confirm(`"${role.name}" эрхийг устгах уу?`)) return
    try {
      await deleteRole(role.id)
      await load()
    } catch {
      alert('Устгахад алдаа гарлаа.')
    }
  }

  if (!authLoading && !currentUser?.is_superuser) {
    return (
      <AdminLayout title="Эрхийн түвшин">
        <div className="card p-8 text-center text-gray-500">
          Энэ хэсэгт зөвхөн Super Admin хандах эрхтэй.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Эрхийн түвшин">
      <PageHeader
        title="Role удирдлага"
        description="Админ, эсвэл өөр шинэ эрхийн түвшин үүсгэж, модуль тус бүрээр зөвшөөрөл олгоно"
        action={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
            Шинэ role
          </Button>
        }
      />

      <DataTable<RoleDetail>
        loading={loading}
        data={roles}
        columns={[
          { key: 'name', label: 'Нэр' },
          { key: 'user_count', label: 'Хэрэглэгчийн тоо' },
          {
            key: 'permissions',
            label: 'Зөвшөөрөл',
            render: (r) => `${r.permissions.length} зөвшөөрөл`,
          },
        ]}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRole ? 'Role засах' : 'Шинэ role'} size="lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <Input label="Нэр" value={name} onChange={(e) => setName(e.target.value)} required />

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Зөвшөөрөл (модулиар)</p>
            <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-200 rounded-xl p-4">
              {groupedPermissions.map(([model, perms]) => (
                <div key={model}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{model}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {perms.map((p) => (
                      <Checkbox
                        key={p.id}
                        label={ACTION_LABELS[actionFromCodename(p.codename)] || p.codename}
                        checked={selectedPermIds.has(p.id)}
                        onChange={() => togglePerm(p.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {groupedPermissions.length === 0 && (
                <p className="text-sm text-gray-400">Зөвшөөрлийн жагсаалт байхгүй байна.</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} submitText="Хадгалах" />
        </form>
      </Modal>
    </AdminLayout>
  )
}
