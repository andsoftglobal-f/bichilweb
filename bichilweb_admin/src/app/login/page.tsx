'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Input, Button } from '@/components/FormElements'
import { login } from '@/actions/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)

      if ('error' in result) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.user.must_change_password) {
        router.push('/change-password')
        return
      }

      router.push(next)
      router.refresh()
    } catch {
      setError('Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.')
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Админ панелд нэвтрэх</h1>
          <p className="text-sm text-slate-500 mb-6">Bichil Globus удирдлагын самбар</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Нэвтрэх нэр"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
            <Input
              label="Нууц үг"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full justify-center" loading={loading}>
              Нэвтрэх
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
