'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader, Button } from '@/components/FormElements';
import { axiosInstance } from '@/lib/axios';
import {
  DocumentArrowDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ClockIcon,
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface CvApplication {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  message: string;
  cv_file: string;
  job: number | null;
  job_title: string | null;
  status: number;
  status_label: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 0, label: 'Шинэ', color: 'bg-blue-100 text-blue-700' },
  { value: 1, label: 'Хянагдаж байна', color: 'bg-yellow-100 text-yellow-700' },
  { value: 2, label: 'Зөвшөөрсөн', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Татгалзсан', color: 'bg-red-100 text-red-700' },
];

export default function CvApplicationsPage() {
  const [applications, setApplications] = useState<CvApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [selected, setSelected] = useState<CvApplication | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cv-applications/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setApplications(data);
    } catch {
      setMessage({ type: 'error', text: 'Өргөдлүүд уншихад алдаа гарлаа' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const updateStatus = async (id: number, newStatus: number) => {
    try {
      await axiosInstance.patch(`/cv-applications/${id}/`, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, status_label: STATUS_OPTIONS.find(s => s.value === newStatus)?.label || '' } : a));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus, status_label: STATUS_OPTIONS.find(s => s.value === newStatus)?.label || '' } : null);
      setMessage({ type: 'success', text: 'Статус шинэчлэгдлээ' });
    } catch {
      setMessage({ type: 'error', text: 'Статус шинэчлэхэд алдаа' });
    }
  };

  const deleteApplication = async (id: number) => {
    if (!confirm('Энэ өргөдлийг устгах уу?')) return;
    try {
      await axiosInstance.delete(`/cv-applications/${id}/`);
      setApplications(prev => prev.filter(a => a.id !== id));
      if (selected?.id === id) setSelected(null);
      setMessage({ type: 'success', text: 'Устгагдлаа' });
    } catch {
      setMessage({ type: 'error', text: 'Устгахад алдаа гарлаа' });
    }
  };

  const filtered = filterStatus !== null ? applications.filter(a => a.status === filterStatus) : applications;

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  const statusBadge = (s: number) => {
    const opt = STATUS_OPTIONS.find(o => o.value === s);
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${opt?.color || 'bg-gray-100 text-gray-600'}`}>{opt?.label || 'Тодорхойгүй'}</span>;
  };

  return (
    <AdminLayout title="CV Өргөдлүүд">
      <PageHeader
        title="CV Өргөдлүүд"
        description="Ирсэн CV/анкет өргөдлүүдийг удирдах"
      />

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <FunnelIcon className="w-4 h-4 text-gray-500" />
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === null ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Бүгд ({applications.length})
        </button>
        {STATUS_OPTIONS.map(opt => {
          const count = applications.filter(a => a.status === opt.value).length;
          return (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === opt.value ? 'bg-gray-800 text-white' : opt.color + ' hover:opacity-80'}`}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Өргөдөл байхгүй</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Нэр</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Холбоо барих</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Албан тушаал</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Туршлага</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Огноо</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">CV</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{app.last_name} {app.first_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600 text-xs">
                        <EnvelopeIcon className="w-3.5 h-3.5" /> {app.email}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 text-xs mt-0.5">
                        <PhoneIcon className="w-3.5 h-3.5" /> {app.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{app.job_title || app.position || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{app.experience || '-'}</td>
                    <td className="px-4 py-3">{statusBadge(app.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(app.created_at)}</td>
                    <td className="px-4 py-3">
                      {app.cv_file ? (
                        <a href={app.cv_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                          <DocumentArrowDownIcon className="w-4 h-4" /> Татах
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(app)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Дэлгэрэнгүй"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Устгах"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">Өргөдлийн дэлгэрэнгүй</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Овог</label>
                  <p className="font-medium text-gray-900">{selected.last_name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Нэр</label>
                  <p className="font-medium text-gray-900">{selected.first_name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Имэйл</label>
                  <p className="text-gray-700">{selected.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Утас</label>
                  <p className="text-gray-700">{selected.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Албан тушаал</label>
                  <p className="text-gray-700">{selected.job_title || selected.position || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Туршлага</label>
                  <p className="text-gray-700">{selected.experience || '-'}</p>
                </div>
              </div>

              {selected.message && (
                <div>
                  <label className="text-xs text-gray-400 block mb-0.5">Танилцуулга</label>
                  <p className="text-gray-700 text-sm whitespace-pre-line bg-gray-50 rounded-lg p-3">{selected.message}</p>
                </div>
              )}

              {selected.cv_file && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">CV файл</label>
                  <a
                    href={selected.cv_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium transition"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    CV татах
                  </a>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 block mb-1">Огноо</label>
                <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                  <ClockIcon className="w-4 h-4" />
                  {fmtDate(selected.created_at)}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Статус өөрчлөх</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(selected.id, opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        selected.status === opt.value
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
