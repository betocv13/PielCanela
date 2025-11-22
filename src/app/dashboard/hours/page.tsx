'use client'

import { useState, useEffect } from 'react'
import { Zap, Calendar, Loader2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { BusinessHours } from '@/types'

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// Generate time options from 5:00 AM to 11:00 PM in 30-minute intervals
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  for (let hour = 5; hour <= 23; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      options.push({
        value,
        label: formatTime(value),
      })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [orderingEnabled, setOrderingEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingOrdering, setTogglingOrdering] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalHours, setOriginalHours] = useState<BusinessHours[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch hours and settings in parallel
        const [hoursRes, settingsRes] = await Promise.all([
          fetch('/api/hours'),
          fetch('/api/settings'),
        ])

        if (hoursRes.ok) {
          const hoursData = await hoursRes.json()
          setHours(hoursData.hours)
          setOriginalHours(JSON.parse(JSON.stringify(hoursData.hours)))
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          // Parse the JSON string value
          const enabled = settingsData.settings.ordering_enabled
          setOrderingEnabled(enabled === true || enabled === 'true')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage({ type: 'error', text: 'Failed to load business hours' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Check for changes
  useEffect(() => {
    if (originalHours.length === 0) return

    const hasChanges = hours.some((day, index) => {
      const original = originalHours[index]
      return (
        day.is_open !== original.is_open ||
        day.open_time !== original.open_time ||
        day.close_time !== original.close_time
      )
    })
    setHasChanges(hasChanges)
  }, [hours, originalHours])

  // Toggle ordering enabled/disabled
  async function handleToggleOrdering() {
    setTogglingOrdering(true)
    setMessage(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'ordering_enabled',
          value: !orderingEnabled,
        }),
      })

      if (res.ok) {
        setOrderingEnabled(!orderingEnabled)
        setMessage({
          type: 'success',
          text: !orderingEnabled ? 'Now accepting orders' : 'Ordering has been closed',
        })
      } else {
        setMessage({ type: 'error', text: 'Failed to update ordering status' })
      }
    } catch (error) {
      console.error('Error toggling ordering:', error)
      setMessage({ type: 'error', text: 'Failed to update ordering status' })
    } finally {
      setTogglingOrdering(false)
    }
  }

  // Update a specific day's hours
  function updateDay(dayIndex: number, field: 'is_open' | 'open_time' | 'close_time', value: boolean | string) {
    setHours(prev =>
      prev.map(day =>
        day.day_of_week === dayIndex
          ? { ...day, [field]: value }
          : day
      )
    )
  }

  // Save hours
  async function handleSave() {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      })

      if (res.ok) {
        const data = await res.json()
        setHours(data.hours)
        setOriginalHours(JSON.parse(JSON.stringify(data.hours)))
        setHasChanges(false)
        setMessage({ type: 'success', text: 'Business hours saved successfully' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save hours' })
      }
    } catch (error) {
      console.error('Error saving hours:', error)
      setMessage({ type: 'error', text: 'Failed to save hours' })
    } finally {
      setSaving(false)
    }
  }

  // Cancel changes
  function handleCancel() {
    setHours(JSON.parse(JSON.stringify(originalHours)))
    setHasChanges(false)
    setMessage(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-brown" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-heading text-brand-brown mb-2">
        Business Hours
      </h1>
      <p className="text-brand-brown/70 mb-6">
        Set your operating days and hours for customer orders
      </p>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Quick Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-heading text-brand-brown mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Quick Controls
        </h2>

        <div className="space-y-4">
          {/* Accept New Orders Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-brown">Accept New Orders</p>
              <p className={`text-sm ${orderingEnabled ? 'text-brand-green' : 'text-red-500'}`}>
                {orderingEnabled ? 'Currently accepting orders ✓' : 'Not accepting orders ✗'}
              </p>
            </div>
            <button
              onClick={handleToggleOrdering}
              disabled={togglingOrdering}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                orderingEnabled ? 'bg-brand-brown' : 'bg-gray-300'
              } ${togglingOrdering ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  orderingEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Temporarily Close Ordering Button */}
          <button
            onClick={handleToggleOrdering}
            disabled={togglingOrdering || !orderingEnabled}
            className={`w-full py-3 px-4 rounded-lg border-2 border-brand-brown/20 text-brand-brown font-medium
              hover:bg-brand-brown/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {togglingOrdering ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </span>
            ) : (
              'Temporarily Close Ordering'
            )}
          </button>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-heading text-brand-brown mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-pink" />
          Weekly Schedule
        </h2>

        <div className="space-y-6">
          {hours.map((day) => (
            <div
              key={day.day_of_week}
              className="pb-6 border-b border-gray-100 last:border-0 last:pb-0"
            >
              {/* Day row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Day name and toggle */}
                <div className="flex items-center justify-between sm:w-48">
                  <span className="font-medium text-brand-brown">
                    {DAYS_OF_WEEK[day.day_of_week]}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateDay(day.day_of_week, 'is_open', !day.is_open)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        day.is_open ? 'bg-brand-brown' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          day.is_open ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium ${
                        day.is_open ? 'text-brand-green' : 'text-brand-brown/60'
                      }`}
                    >
                      {day.is_open ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </div>

                {/* Time selectors */}
                <div className="flex flex-1 flex-col sm:flex-row gap-4">
                  {/* Open time */}
                  <div className="flex-1">
                    <label className="block text-sm text-brand-brown/70 mb-1">
                      Open:
                    </label>
                    <select
                      value={day.open_time}
                      onChange={(e) => updateDay(day.day_of_week, 'open_time', e.target.value)}
                      disabled={!day.is_open}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                        focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown
                        ${!day.is_open ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                    >
                      {!day.is_open ? (
                        <option value={day.open_time}>--:--</option>
                      ) : (
                        TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Close time */}
                  <div className="flex-1">
                    <label className="block text-sm text-brand-brown/70 mb-1">
                      Close:
                    </label>
                    <select
                      value={day.close_time}
                      onChange={(e) => updateDay(day.day_of_week, 'close_time', e.target.value)}
                      disabled={!day.is_open}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                        focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown
                        ${!day.is_open ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                    >
                      {!day.is_open ? (
                        <option value={day.close_time}>--:--</option>
                      ) : (
                        TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleCancel}
            disabled={!hasChanges || saving}
            className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-200 text-brand-brown font-medium
              hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex-1 py-3 px-4 rounded-lg bg-brand-brown text-white font-medium
              hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Hours'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
