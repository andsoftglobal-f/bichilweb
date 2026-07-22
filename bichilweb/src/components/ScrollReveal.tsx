'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  /** Animation direction: 'up' | 'down' | 'left' | 'right' */
  direction?: 'up' | 'down' | 'left' | 'right'
  /** Delay in ms before animation starts */
  delay?: number
  /** Duration of the animation in ms */
  duration?: number
  /** How far the element travels (px) */
  distance?: number
  /** IntersectionObserver threshold (0-1) */
  threshold?: number
  /** Once true, animates only the first time */
  once?: boolean
  /** Extra className */
  className?: string
  /** Scale from (0-1). 0.95 gives a subtle zoom-in */
  scale?: number
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 800,
  distance = 60,
  threshold = 0.08,
  once = true,
  className = '',
  scale = 1,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) io.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])

  const translate = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  }

  const hiddenTransform = `${translate[direction]}${scale !== 1 ? ` scale(${scale})` : ''}`
  const visibleTransform = `translate(0,0)${scale !== 1 ? ' scale(1)' : ''}`

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? visibleTransform : hiddenTransform,
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
