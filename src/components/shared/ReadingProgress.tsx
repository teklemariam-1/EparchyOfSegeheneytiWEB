'use client'

import { useEffect, useState } from 'react'

/** Thin progress bar at the top of the viewport showing scroll progress. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      setProgress(total > 0 ? Math.min(100, (doc.scrollTop / total) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent print:hidden">
      <div
        className="h-full bg-gradient-to-r from-maroon-700 to-gold-500 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default ReadingProgress
