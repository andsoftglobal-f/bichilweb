'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { PlusIcon, TagIcon, TrashIcon, PencilIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useSaveReset } from '@/hooks/useSaveReset'
import { SaveResetButtons } from '@/components/SaveResetButtons'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import { FontSelect } from '@/lib/fontOptions'

interface BranchCategory {
  id: number
  name: string
  name_en: string
  sort_order: number
  active: boolean
}

interface BranchAPI {
  id: number
  name: string
  name_en: string
  location: string
  location_en?: string
  image?: string
  image_url?: string | null
  area?: string | null
  area_en?: string | null
  city?: string | null
  city_en?: string | null
  district?: string | null
  district_en?: string | null
  open?: string | null
  open_en?: string | null
  time?: string | null
  latitude: string  
  longitude: string 
  phones: { id?: number; phone: string }[]
  category_id?: number | null
  category_name?: string | null
  category_name_en?: string | null
}

interface Branch {
  id: number
  name: string
  name_en: string
  location: string
  location_en: string
  image?: string | null
  image_url: string | null
  area?: string | null
  area_en?: string | null
  city?: string | null
  city_en?: string | null
  district?: string | null
  district_en?: string | null
  open?: string | null
  open_en?: string | null
  time?: string | null
  latitude: number | null
  longitude: number | null
  phones: { id?: number; phone: string }[]
  category_id: number | null
  category_name: string | null
  category_name_en: string | null
}

interface BranchFormData {
  name: string
  name_en: string
  location: string
  location_en: string
  open: string
  open_en: string
  time: string
  latitude: number | null
  longitude: number | null
  phones: string[]
  area: string
  area_en: string
  city: string
  city_en: string
  district: string
  district_en: string
  imageFile: File | null
  category_id: number | null
}

interface BranchPageSettings {
  popup_bg: string
  popup_title_color: string
  popup_text_color: string
  popup_icon_color: string
  popup_btn_bg: string
  popup_btn_text: string
  popup_btn_label: string
  popup_btn_label_en: string
  card_bg: string
  card_border: string
  card_title_color: string
  card_text_color: string
  card_icon_color: string
  card_btn_bg: string
  card_btn_text: string
  card_btn_label: string
  card_btn_label_en: string
  marker_color: string
  marker_selected_color: string
  map_btn_bg: string
  map_btn_text: string
  map_btn_label: string
  map_btn_label_en: string
  fontfamily: string
}

const defaultPageSettings: BranchPageSettings = {
  popup_bg: '#ffffff',
  popup_title_color: '#111827',
  popup_text_color: '#374151',
  popup_icon_color: '#0048BA',
  popup_btn_bg: '#0048BA',
  popup_btn_text: '#ffffff',
  popup_btn_label: 'Чиглэл авах',
  popup_btn_label_en: '',
  card_bg: '#ffffff',
  card_border: '#e5e7eb',
  card_title_color: '#111827',
  card_text_color: '#4b5563',
  card_icon_color: '#0048BA',
  card_btn_bg: '#f0fdfa',
  card_btn_text: '#0048BA',
  card_btn_label: 'Газрын зургаас харах',
  card_btn_label_en: '',
  marker_color: '#0048BA',
  marker_selected_color: '#003a95',
  map_btn_bg: '#0048BA',
  map_btn_text: '#ffffff',
  map_btn_label: 'Газрын зураг',
  map_btn_label_en: '',
  fontfamily: '',
}

const initialFormData: BranchFormData = {
  name: '',
  name_en: '',
  location: '',
  location_en: '',
  open: 'Даваа-Баасан',
  open_en: '',
  time: '09:00-18:00',
  latitude: 47.9184,
  longitude: 106.9177,
  phones: [''],
  area: '',
  area_en: '',
  city: '',
  city_en: '',
  district: '',
  district_en: '',
  imageFile: null,
  category_id: null,
}

const transformAPIToBranch = (apiData: BranchAPI): Branch => ({
  ...apiData,
  name_en: apiData.name_en || '',
  location_en: apiData.location_en || '',
  area_en: apiData.area_en || '',
  city_en: apiData.city_en || '',
  district_en: apiData.district_en || '',
  open_en: apiData.open_en || '',
  image: apiData.image_url || apiData.image || null,
  image_url: apiData.image_url ?? null,
  latitude: apiData.latitude ? parseFloat(apiData.latitude) : null,
  longitude: apiData.longitude ? parseFloat(apiData.longitude) : null,
  category_id: apiData.category_id ?? null,
  category_name: apiData.category_name ?? null,
  category_name_en: apiData.category_name_en ?? null,
})

export default function BranchesPage() {
  const { data: branches, setData: setBranches, saveSuccess, handleSave: saveData, handleReset } = useSaveReset<Branch[]>('branches', [])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState<BranchFormData>(initialFormData)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<BranchCategory[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('')
  const [editingCategory, setEditingCategory] = useState<BranchCategory | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryNameEn, setEditCategoryNameEn] = useState('')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [pageSettings, setPageSettings] = useState<BranchPageSettings>(defaultPageSettings)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    fetchBranches()
    fetchCategories()
    fetchPageSettings()
  }, [])

  const fetchPageSettings = async () => {
    try {
      const res = await axiosInstance.get('/branch-settings/')
      if (res.data) {
        setPageSettings({ ...defaultPageSettings, ...res.data })
      }
    } catch (error) {
      console.error('Тохиргоо татахад алдаа:', error)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await axiosInstance.post('/branch-settings/', pageSettings)
      alert('Тохиргоо амжилттай хадгалагдлаа!')
      setShowSettingsModal(false)
    } catch (error) {
      console.error('Тохиргоо хадгалахад алдаа:', error)
      alert('Тохиргоо хадгалахад алдаа гарлаа')
    } finally {
      setSavingSettings(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/branch-category/')
      const raw = response.data
      const arr: BranchCategory[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setCategories(arr.sort((a, b) => a.sort_order - b.sort_order))
    } catch (error) {
      console.error('Ангилал татахад алдаа:', error)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      await axiosInstance.post('/branch-category/', { 
        name: newCategoryName.trim(), 
        name_en: newCategoryNameEn.trim(),
        sort_order: categories.length,
        active: true 
      })
      setNewCategoryName('')
      setNewCategoryNameEn('')
      await fetchCategories()
    } catch (error) {
      console.error('Ангилал нэмэхэд алдаа:', error)
      alert('Ангилал нэмэхэд алдаа гарлаа')
    }
  }

  const handleUpdateCategory = async (cat: BranchCategory) => {
    if (!editCategoryName.trim()) return
    try {
      await axiosInstance.put(`/branch-category/${cat.id}/`, {
        ...cat,
        name: editCategoryName.trim(),
        name_en: editCategoryNameEn.trim()
      })
      setEditingCategory(null)
      setEditCategoryName('')
      setEditCategoryNameEn('')
      await fetchCategories()
      await fetchBranches() // refresh branch category names
    } catch (error) {
      console.error('Ангилал засахад алдаа:', error)
      alert('Ангилал засахад алдаа гарлаа')
    }
  }

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Энэ ангилалыг устгахдаа итгэлтэй байна уу? Салбарууд ангилалгүй болно.')) return
    try {
      await axiosInstance.delete(`/branch-category/${catId}/`)
      await fetchCategories()
      await fetchBranches()
    } catch (error) {
      console.error('Ангилал устгахад алдаа:', error)
      alert('Ангилал устгахад алдаа гарлаа')
    }
  }

  const handleToggleCategoryActive = async (cat: BranchCategory) => {
    try {
      await axiosInstance.put(`/branch-category/${cat.id}/`, {
        ...cat,
        active: !cat.active
      })
      await fetchCategories()
    } catch (error) {
      console.error('Ангилал засахад алдаа:', error)
    }
  }

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/branch/')
      const raw = response.data as any
      const branchData: BranchAPI[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setBranches(branchData.map(transformAPIToBranch))
    } catch (error) {
      console.error('Салбарын мэдээлэл татахад алдаа гарлаа:', error)
      alert('Салбарын мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      formDataToSend.append('name', formData.name)
      formDataToSend.append('name_en', formData.name_en || '')
      formDataToSend.append('location', formData.location)
      formDataToSend.append('location_en', formData.location_en || '')
      formDataToSend.append('area', formData.area || '')
      formDataToSend.append('area_en', formData.area_en || '')
      formDataToSend.append('city', formData.city || '')
      formDataToSend.append('city_en', formData.city_en || '')
      formDataToSend.append('district', formData.district || '')
      formDataToSend.append('district_en', formData.district_en || '')
      formDataToSend.append('open', formData.open || '')
      formDataToSend.append('open_en', formData.open_en || '')
      formDataToSend.append('time', formData.time || '')
      formDataToSend.append('latitude', formData.latitude !== null ? formData.latitude.toString() : '0')
      formDataToSend.append('longitude', formData.longitude !== null ? formData.longitude.toString() : '0')
      
      if (formData.category_id !== null) {
        formDataToSend.append('category_id', formData.category_id.toString())
      } else {
        formDataToSend.append('category_id', '0')
      }
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile)
      }
      
      const validPhones = formData.phones.filter(p => p.trim() !== '')
      
      if (validPhones.length === 0) {
        alert('Дор хаяж нэг утасны дугаар оруулна уу')
        setSubmitting(false)
        return
      }
      
      const phonesData = validPhones.map(p => ({ phone: p.trim() }))
      formDataToSend.append('phones', JSON.stringify(phonesData))

      let response
      if (editingBranch) {
        response = await axiosInstance.put(`/branch/${editingBranch.id}/`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        response = await axiosInstance.post('/branch/', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }
      
      await fetchBranches()
      handleCloseModal()
      
      alert(editingBranch ? 'Салбар амжилттай засагдлаа!' : 'Салбар амжилттай нэмэгдлээ!')
    } catch (error: any) {
      console.error('Салбар хадгалахад алдаа гарлаа:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = 'Хадгалахад алдаа гарлаа'
      
      if (error.response?.data) {
        const errors = error.response.data
        const errorMessages: string[] = []
        
        if (errors.phones) {
          if (typeof errors.phones === 'string') {
            errorMessages.push(`Утас: ${errors.phones}`)
          } else if (Array.isArray(errors.phones)) {
            errors.phones.forEach((phoneError: any, index: number) => {
              if (typeof phoneError === 'string') {
                errorMessages.push(`Утас: ${phoneError}`)
              } else if (phoneError && typeof phoneError === 'object') {
                Object.entries(phoneError).forEach(([field, messages]) => {
                  if (Array.isArray(messages)) {
                    errorMessages.push(`Утас ${index + 1} - ${field}: ${messages.join(', ')}`)
                  }
                })
              }
            })
          }
        }
        
        for (const [field, messages] of Object.entries(errors)) {
          if (field === 'phones') continue 
          
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`)
          } else if (typeof messages === 'string') {
            errorMessages.push(`${field}: ${messages}`)
          }
        }
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n')
        }
      }
      
      alert(`Алдаа:\n${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`"${branch.name}" салбарыг устгахдаа итгэлтэй байна уу?`)) return

    try {
      await axiosInstance.delete(`/branch/${branch.id}/`)
      await fetchBranches()
      alert('Салбар амжилттай устгагдлаа!')
    } catch (error: any) {
      console.error('Салбар устгахад алдаа гарлаа:', error)
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error 
        || error.message 
        || 'Устгахад алдаа гарлаа'
      alert(`Алдаа: ${errorMessage}`)
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      name_en: branch.name_en || '',
      location: branch.location,
      location_en: branch.location_en || '',
      open: branch.open || '',
      open_en: branch.open_en || '',
      time: branch.time || '',
      latitude: branch.latitude || 47.9184,
      longitude: branch.longitude || 106.9177,
      phones: branch.phones && branch.phones.length > 0 
        ? branch.phones.map(p => p.phone) 
        : [''],
      area: branch.area || '',
      area_en: branch.area_en || '',
      city: branch.city || '',
      city_en: branch.city_en || '',
      district: branch.district || '',
      district_en: branch.district_en || '',
      imageFile: null,
      category_id: branch.category_id ?? null,
    })
    setImagePreview(branch.image_url?.startsWith('http') ? branch.image_url : (branch.image_url ? `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${branch.image_url}` : ''))
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingBranch(null)
    setFormData(initialFormData)
    setImagePreview('')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Зургийн хэмжээ 5MB-аас бага байх ёстой')
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Зөвхөн зураг оруулна уу')
      e.target.value = ''
      return
    }

    setFormData(prev => ({ ...prev, imageFile: file }))

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.onerror = () => {
      alert('Зураг унших үед алдаа гарлаа')
      setFormData(prev => ({ ...prev, imageFile: null }))
      setImagePreview('')
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null }))
    setImagePreview('')
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleAddPhone = () => {
    setFormData(prev => ({ 
      ...prev, 
      phones: [...prev.phones, ''] 
    }))
  }

  const handleRemovePhone = (index: number) => {
    const newPhones = formData.phones.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, phones: newPhones.length > 0 ? newPhones : [''] }))
  }

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones]
    newPhones[index] = value
    setFormData(prev => ({ ...prev, phones: newPhones }))
  }

  const columns = [
    { 
      key: 'image', 
      label: 'Зураг',
      render: (branch: Branch) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {branch.image ? (
            <img 
              src={branch.image_url?.startsWith('http') ? branch.image_url : `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${branch.image_url}`} 
              alt={branch.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Нэр',
      render: (branch: Branch) => (
        <div className="font-medium text-gray-900">{branch.name}</div>
      )
    },
    { 
      key: 'location', 
      label: 'Хаяг',
      render: (branch: Branch) => (
        <div className="text-sm text-gray-600">{branch.location}</div>
      )
    },
    { 
      key: 'phones', 
      label: 'Утас',
      render: (branch: Branch) => (
        <div className="space-y-1">
          {branch.phones && branch.phones.length > 0 ? (
            branch.phones.slice(0, 2).map((p, i) => (
              <div key={p.id || i} className="text-sm text-gray-700">{p.phone}</div>
            ))
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
          {branch.phones && branch.phones.length > 2 && (
            <div className="text-xs text-gray-500">+{branch.phones.length - 2} бусад</div>
          )}
        </div>
      )
    },
    { 
      key: 'location_details', 
      label: 'Байршил',
      render: (branch: Branch) => (
        <div className="text-xs space-y-0.5">
          {branch.district && <div className="text-gray-900 font-medium">{branch.district}</div>}
          {branch.area && <div className="text-gray-600">{branch.area}</div>}
          {branch.city && <div className="text-gray-500">{branch.city}</div>}
          {!branch.district && !branch.area && !branch.city && <span className="text-gray-400">-</span>}
        </div>
      )
    },
    { 
      key: 'time', 
      label: 'Ажлын цаг',
      render: (branch: Branch) => (
        <div className="text-xs space-y-0.5">
          {branch.open && <div className="text-gray-700">{branch.open}</div>}
          {branch.time && <div className="text-gray-600">{branch.time}</div>}
          {!branch.open && !branch.time && <span className="text-gray-400">-</span>}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Ангилал',
      render: (branch: Branch) => (
        <div>
          {branch.category_name ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
              {branch.category_name}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
      )
    },
  ]

  return (
    <AdminLayout title="Салбарууд">
      {saveSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900">Амжилттай хадгалагдлаа!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">Өөрчлөлтүүд хадгалагдсан.</p>
          </div>
        </div>
      )}
      
      <PageHeader
        title="Салбарууд"
        description={`Нийт ${branches.length} салбар`}
        action={
          <div className="flex items-center gap-3">
            <SaveResetButtons 
              onSave={saveData}
              onReset={handleReset}
              confirmMessage="Та хадгалахдаа итгэлтэй байна уу?"
            />
            <button
              onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all"
            >
              <TagIcon className="h-5 w-5" />
              Ангилал
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all"
            >
              <Cog6ToothIcon className="h-5 w-5" />
              Тохиргоо
            </button>
            <button 
              onClick={() => setModalOpen(true)} 
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 shadow-sm transition-all hover:shadow-md"
            >
              <PlusIcon className="h-5 w-5" />
              Шинэ салбар
            </button>
          </div>
        }
      />

      <DataTable 
        columns={columns} 
        data={branches} 
        loading={loading} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal 
        isOpen={modalOpen} 
        onClose={handleCloseModal} 
        title={editingBranch ? 'Салбар засварлах' : 'Шинэ салбар'} 
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ангилал
            </label>
            <select
              value={formData.category_id ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : null }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              disabled={submitting}
            >
              <option value="">Ангилалгүй</option>
              {categories.filter(c => c.active).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Салбарын нэр <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Төв салбар"
                required 
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Англи нэр
              </label>
              <input 
                type="text" 
                value={formData.name_en} 
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Main Branch"
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Хаяг <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={formData.location} 
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} 
                rows={2} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                placeholder="Сүхбаатарын талбай 1"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Хаяг (Англи)
              </label>
              <textarea 
                value={formData.location_en} 
                onChange={(e) => setFormData(prev => ({ ...prev, location_en: e.target.value }))} 
                rows={2} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                placeholder="Sukhbaatar Square 1"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Зураг
              <span className="text-xs text-gray-500 ml-2">(Хэмжээ: 5MB хүртэл)</span>
            </label>
            <div className="space-y-3">
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageUpload}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer cursor-pointer"
                disabled={submitting}
              />
            </div>
            {/* Image dimension guide */}
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /><rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Зөвлөмж хэмжээ: <span className="text-blue-700">800 × 500 px</span></p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Харьцаа <strong className="text-slate-700">8:5</strong> · Desktop, Phone аль алинд тохирно · <strong className="text-slate-700">object-cover</strong>
                  </p>
                </div>
              </div>
            </div>

            {imagePreview && (
              <div className="mt-3 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
                  disabled={submitting}
                  title="Зураг устгах"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Дүүрэг/Сум</label>
              <input 
                type="text" 
                value={formData.area || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Сүхбаатар дүүрэг"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Хот/Аймаг</label>
              <input 
                type="text" 
                value={formData.city || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Улаанбаатар"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Хороо/Баг</label>
              <input 
                type="text" 
                value={formData.district || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="1-р хороо"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Location Details (English) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Дүүрэг/Сум (Англи)</label>
              <input 
                type="text" 
                value={formData.area_en || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, area_en: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Sukhbaatar District"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Хот/Аймаг (Англи)</label>
              <input 
                type="text" 
                value={formData.city_en || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, city_en: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Ulaanbaatar"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Хороо/Баг (Англи)</label>
              <input 
                type="text" 
                value={formData.district_en || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, district_en: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Khoroo 1"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ажлын өдрүүд</label>
              <input 
                type="text" 
                value={formData.open || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, open: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Даваа-Баасан"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ажлын өдрүүд (Англи)</label>
              <input 
                type="text" 
                value={formData.open_en || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, open_en: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Monday-Friday"
                disabled={submitting}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ажлын цаг</label>
              <input 
                type="text" 
                value={formData.time || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="09:00-18:00"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Өргөрөг (Latitude)
              </label>
              <input 
                type="number" 
                step="0.0001"
                value={formData.latitude ?? ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  latitude: e.target.value ? parseFloat(e.target.value) : null 
                }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="47.9184"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Уртраг (Longitude)
              </label>
              <input 
                type="number" 
                step="0.0001"
                value={formData.longitude ?? ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  longitude: e.target.value ? parseFloat(e.target.value) : null 
                }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="106.9177"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Google Maps линк
              <span className="text-xs text-gray-400 ml-2">(Линк оруулбал координат автоматаар гарна)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://maps.google.com/... эсвэл https://goo.gl/maps/..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                disabled={submitting}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text')
                  setTimeout(() => {
                    // Try @lat,lng pattern
                    let match = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
                    if (!match) {
                      // Try ?q=lat,lng or !3d...!4d... patterns
                      match = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
                    }
                    if (match) {
                      setFormData(prev => ({
                        ...prev,
                        latitude: parseFloat(match![1]),
                        longitude: parseFloat(match![2]),
                      }))
                      alert(`Координат олдлоо: ${match[1]}, ${match[2]}`)
                    }
                  }, 100)
                }}
                onChange={(e) => {
                  const text = e.target.value
                  let match = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
                  if (!match) {
                    match = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
                  }
                  if (match) {
                    setFormData(prev => ({
                      ...prev,
                      latitude: parseFloat(match![1]),
                      longitude: parseFloat(match![2]),
                    }))
                  }
                }}
              />
            </div>
            {formData.latitude && formData.longitude && (
              <p className="mt-1 text-xs text-teal-600">
                📍 {formData.latitude}, {formData.longitude}
              </p>
            )}
          </div>

          {/* Phone Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Утасны дугаарууд <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    placeholder="70111111"
                    disabled={submitting}
                  />
                  {formData.phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      Устгах
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPhone}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                + Утас нэмэх
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={handleCloseModal} 
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Цуцлах
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitting}
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Manager Modal */}
      <Modal
        isOpen={showCategoryManager}
        onClose={() => {
          setShowCategoryManager(false)
          setEditingCategory(null)
          setEditCategoryName('')
          setEditCategoryNameEn('')
          setNewCategoryName('')
          setNewCategoryNameEn('')
        }}
        title="Салбарын ангилал удирдах"
        size="md"
      >
        <div className="space-y-4">
          {/* Add new category */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Шинэ ангилалын нэр..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-1.5"
              >
                <PlusIcon className="h-4 w-4" />
                Нэмэх
              </button>
            </div>
            <input
              type="text"
              value={newCategoryNameEn}
              onChange={(e) => setNewCategoryNameEn(e.target.value)}
              placeholder="English name..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
            />
          </div>

          {/* Categories list */}
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TagIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ангилал байхгүй байна</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    cat.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  {editingCategory?.id === cat.id ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-teal-500 outline-none"
                          autoFocus
                          placeholder="Монгол нэр"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleUpdateCategory(cat) }
                            if (e.key === 'Escape') { setEditingCategory(null); setEditCategoryName(''); setEditCategoryNameEn('') }
                          }}
                        />
                        <button
                          onClick={() => handleUpdateCategory(cat)}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-xs font-medium hover:bg-teal-700"
                        >
                          Хадгалах
                        </button>
                        <button
                          onClick={() => { setEditingCategory(null); setEditCategoryName(''); setEditCategoryNameEn('') }}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md text-xs"
                        >
                          Цуцлах
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editCategoryNameEn}
                        onChange={(e) => setEditCategoryNameEn(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-teal-500 outline-none"
                        placeholder="English name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleUpdateCategory(cat) }
                          if (e.key === 'Escape') { setEditingCategory(null); setEditCategoryName(''); setEditCategoryNameEn('') }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleCategoryActive(cat)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            cat.active ? 'bg-teal-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              cat.active ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${cat.active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {cat.name}
                          {cat.name_en && <span className="text-xs text-gray-400 ml-1">({cat.name_en})</span>}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({branches.filter(b => b.category_id === cat.id).length} салбар)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); setEditCategoryNameEn(cat.name_en || '') }}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                          title="Засах"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Устгах"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Page Settings Modal ── */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Хуудасны өнгөний тохиргоо"
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* ── Map Marker Colors ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Газрын зургийн маркер
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Маркер өнгө" value={pageSettings.marker_color} onChange={(v) => setPageSettings(p => ({ ...p, marker_color: v }))} />
              <ColorField label="Сонгосон маркер" value={pageSettings.marker_selected_color} onChange={(v) => setPageSettings(p => ({ ...p, marker_selected_color: v }))} />
            </div>
          </div>

          {/* ── Popup Colors ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Popup цонх (газрын зурган дээрх)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Арын өнгө" value={pageSettings.popup_bg} onChange={(v) => setPageSettings(p => ({ ...p, popup_bg: v }))} />
              <ColorField label="Гарчгийн өнгө" value={pageSettings.popup_title_color} onChange={(v) => setPageSettings(p => ({ ...p, popup_title_color: v }))} />
              <ColorField label="Текстийн өнгө" value={pageSettings.popup_text_color} onChange={(v) => setPageSettings(p => ({ ...p, popup_text_color: v }))} />
              <ColorField label="Icon өнгө" value={pageSettings.popup_icon_color} onChange={(v) => setPageSettings(p => ({ ...p, popup_icon_color: v }))} />
              <ColorField label="Товчны арын өнгө" value={pageSettings.popup_btn_bg} onChange={(v) => setPageSettings(p => ({ ...p, popup_btn_bg: v }))} />
              <ColorField label="Товчны текст өнгө" value={pageSettings.popup_btn_text} onChange={(v) => setPageSettings(p => ({ ...p, popup_btn_text: v }))} />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Товчны текст</label>
              <input
                type="text"
                value={pageSettings.popup_btn_label}
                onChange={(e) => setPageSettings(p => ({ ...p, popup_btn_label: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Товчны текст (Англи)</label>
              <input
                type="text"
                value={pageSettings.popup_btn_label_en}
                onChange={(e) => setPageSettings(p => ({ ...p, popup_btn_label_en: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="Get Directions"
              />
            </div>
          </div>

          {/* ── Card Colors ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Салбарын карт
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Картын арын өнгө" value={pageSettings.card_bg} onChange={(v) => setPageSettings(p => ({ ...p, card_bg: v }))} />
              <ColorField label="Хүрээний өнгө" value={pageSettings.card_border} onChange={(v) => setPageSettings(p => ({ ...p, card_border: v }))} />
              <ColorField label="Гарчгийн өнгө" value={pageSettings.card_title_color} onChange={(v) => setPageSettings(p => ({ ...p, card_title_color: v }))} />
              <ColorField label="Текстийн өнгө" value={pageSettings.card_text_color} onChange={(v) => setPageSettings(p => ({ ...p, card_text_color: v }))} />
              <ColorField label="Icon өнгө" value={pageSettings.card_icon_color} onChange={(v) => setPageSettings(p => ({ ...p, card_icon_color: v }))} />
              <ColorField label="Товчны арын өнгө" value={pageSettings.card_btn_bg} onChange={(v) => setPageSettings(p => ({ ...p, card_btn_bg: v }))} />
              <ColorField label="Товчны текст өнгө" value={pageSettings.card_btn_text} onChange={(v) => setPageSettings(p => ({ ...p, card_btn_text: v }))} />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Товчны текст</label>
              <input
                type="text"
                value={pageSettings.card_btn_label}
                onChange={(e) => setPageSettings(p => ({ ...p, card_btn_label: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Товчны текст (Англи)</label>
              <input
                type="text"
                value={pageSettings.card_btn_label_en}
                onChange={(e) => setPageSettings(p => ({ ...p, card_btn_label_en: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="View on Map"
              />
            </div>
          </div>

          {/* ── Map Toggle Button ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Газрын зураг товч
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Товчны арын өнгө" value={pageSettings.map_btn_bg} onChange={(v) => setPageSettings(p => ({ ...p, map_btn_bg: v }))} />
              <ColorField label="Товчны текст өнгө" value={pageSettings.map_btn_text} onChange={(v) => setPageSettings(p => ({ ...p, map_btn_text: v }))} />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Товчны текст</label>
              <input
                type="text"
                value={pageSettings.map_btn_label}
                onChange={(e) => setPageSettings(p => ({ ...p, map_btn_label: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Товчны ард автоматаар &ldquo;хаах / нээх&rdquo; нэмэгдэнэ</p>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Товчны текст (Англи)</label>
              <input
                type="text"
                value={pageSettings.map_btn_label_en}
                onChange={(e) => setPageSettings(p => ({ ...p, map_btn_label_en: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="Map"
              />
            </div>
          </div>

          {/* ── Font Family ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Фонт тохиргоо
            </h4>
            <FontSelect
              label="Фонт гэр бүл"
              value={pageSettings.fontfamily}
              onChange={(v) => setPageSettings(p => ({ ...p, fontfamily: v }))}
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Урьдчилан харах</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Card preview */}
              <div
                className="rounded-lg p-3 border"
                style={{ background: pageSettings.card_bg, borderColor: pageSettings.card_border }}
              >
                <h5 className="text-sm font-bold" style={{ color: pageSettings.card_title_color }}>Төв салбар</h5>
                <p className="text-xs mt-1 flex items-center gap-1">
                  <span style={{ color: pageSettings.card_icon_color }}>●</span>
                  <span style={{ color: pageSettings.card_text_color }}>Хаяг байршил</span>
                </p>
                <button
                  className="w-full mt-2 px-2 py-1.5 rounded text-xs font-medium"
                  style={{ background: pageSettings.card_btn_bg, color: pageSettings.card_btn_text }}
                >
                  {pageSettings.card_btn_label}
                </button>
              </div>
              {/* Popup preview */}
              <div
                className="rounded-lg p-3 border border-gray-200"
                style={{ background: pageSettings.popup_bg }}
              >
                <h5 className="text-sm font-bold" style={{ color: pageSettings.popup_title_color }}>Popup харагдах байдал</h5>
                <p className="text-xs mt-1 flex items-center gap-1">
                  <span style={{ color: pageSettings.popup_icon_color }}>●</span>
                  <span style={{ color: pageSettings.popup_text_color }}>Мэдээлэл</span>
                </p>
                <button
                  className="w-full mt-2 px-2 py-1.5 rounded text-xs font-medium"
                  style={{ background: pageSettings.popup_btn_bg, color: pageSettings.popup_btn_text }}
                >
                  {pageSettings.popup_btn_label}
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={() => { setPageSettings(defaultPageSettings) }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Анхны утга
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {savingSettings ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none"
        />
      </div>
    </div>
  )
}