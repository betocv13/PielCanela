'use client'

import { useState, useEffect } from 'react'

export default function AnnouncementBar() {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(({ settings }) => {
        if (settings?.ordering_enabled) {
          setText('WELCOME TO OUR STORE')
        } else {
          setText(settings?.ordering_closed_message || 'CLOSED FOR PICKUP')
        }
      })
      .catch(() => setText('CLOSED FOR PICKUP'))
  }, [])

  return (
    <div
      className="content-inset-margin mt-3 rounded-[12px] h-10 flex items-center justify-center"
      style={{ backgroundColor: '#FFE8E6' }}
    >
      {text && (
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-700">
          {text}
        </p>
      )}
    </div>
  )
}
