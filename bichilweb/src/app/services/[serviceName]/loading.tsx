import LottieLoading from '@/components/LottieLoading'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <LottieLoading size={140} />
    </div>
  )
}
