'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Input, Button } from '@/components/FormElements'
import { changeOwnPassword } from '@/actions/auth'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Шинэ нууц үг таарахгүй байна.')
      return
    }

    setLoading(true)
    try {
      await changeOwnPassword(oldPassword, newPassword)
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Нууц үг солиход алдаа гарлаа.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/browser-logo.png" alt="Bichil Globus" width={56} height={56} className="h-14 w-14 object-contain" />
        </div>

        <div className="card bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Нууц үг солих</h1>
          <p className="text-sm text-slate-500 mb-6">
            Аюулгүй байдлын үүднээс эхний нэвтрэлтийн дараа нууц үгээ солино уу.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Одоогийн нууц үг"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            <Input
              label="Шинэ нууц үг"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Input
              label="Шинэ нууц үг (давтах)"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full justify-center" loading={loading}>
              Хадгалах
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
