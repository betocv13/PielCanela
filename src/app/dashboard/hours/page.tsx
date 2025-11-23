'use client'

import { useState, useEffect } from 'react'
import { Zap, Calendar, Loader2, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { PickupDate } from '@/types'

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

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function PickupDatesPage() {
  const [dates, setDates] = useState<PickupDate[]>([])
  const [orderingEnabled, setOrderingEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [togglingOrdering, setTogglingOrdering] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // New date form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newOpenTime, setNewOpenTime] = useState('09:00')
  const [newCloseTime, setNewCloseTime] = useState('17:00')
  const [adding, setAdding] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editOpenTime, setEditOpenTime] = useState('')
  const [editCloseTime, setEditCloseTime] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pickup dates and settings in parallel
        const [datesRes, settingsRes] = await Promise.all([
          fetch('/api/pickup-dates'),
          fetch('/api/settings'),
        ])

        if (datesRes.ok) {
          const datesData = await datesRes.json()
          // Normalize time format from "HH:MM:SS" to "HH:MM"
          const normalizedDates = datesData.dates.map((d: PickupDate) => ({
            ...d,
            open_time: d.open_time.slice(0, 5),
            close_time: d.close_time.slice(0, 5),
          }))
          setDates(normalizedDates)
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          const enabled = settingsData.settings.ordering_enabled
          setOrderingEnabled(enabled === true || enabled === 'true')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage({ type: 'error', text: 'Failed to load pickup dates' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  // Add new pickup date
  async function handleAddDate() {
    if (!newDate) {
      setMessage({ type: 'error', text: 'Please select a date' })
      return
    }

    if (newCloseTime <= newOpenTime) {
      setMessage({ type: 'error', text: 'Close time must be after open time' })
      return
    }

    setAdding(true)
    setMessage(null)

    try {
      const res = await fetch('/api/pickup-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          open_time: newOpenTime,
          close_time: newCloseTime,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const normalizedDate = {
          ...data.date,
          open_time: data.date.open_time.slice(0, 5),
          close_time: data.date.close_time.slice(0, 5),
        }
        // Add to list and sort by date
        setDates(prev => [...prev, normalizedDate].sort((a, b) =>
          a.date.localeCompare(b.date)
        ))
        setShowAddForm(false)
        setNewDate('')
        setNewOpenTime('09:00')
        setNewCloseTime('17:00')
        setMessage({ type: 'success', text: `Added pickup date: ${formatDate(newDate)}` })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to add date' })
      }
    } catch (error) {
      console.error('Error adding date:', error)
      setMessage({ type: 'error', text: 'Failed to add date' })
    } finally {
      setAdding(false)
    }
  }

  // Start editing a date
  function startEdit(date: PickupDate) {
    setEditingId(date.id)
    setEditOpenTime(date.open_time)
    setEditCloseTime(date.close_time)
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null)
    setEditOpenTime('')
    setEditCloseTime('')
  }

  // Save edited date
  async function handleSaveEdit(id: string) {
    if (editCloseTime <= editOpenTime) {
      setMessage({ type: 'error', text: 'Close time must be after open time' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/pickup-dates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          open_time: editOpenTime,
          close_time: editCloseTime,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const normalizedDate = {
          ...data.date,
          open_time: data.date.open_time.slice(0, 5),
          close_time: data.date.close_time.slice(0, 5),
        }
        setDates(prev => prev.map(d => d.id === id ? normalizedDate : d))
        cancelEdit()
        setMessage({ type: 'success', text: 'Hours updated successfully' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update hours' })
      }
    } catch (error) {
      console.error('Error updating date:', error)
      setMessage({ type: 'error', text: 'Failed to update hours' })
    } finally {
      setSaving(false)
    }
  }

  // Delete a pickup date
  async function handleDelete(id: string) {
    setDeletingId(id)
    setMessage(null)

    try {
      const res = await fetch(`/api/pickup-dates?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDates(prev => prev.filter(d => d.id !== id))
        setMessage({ type: 'success', text: 'Pickup date removed' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete date' })
      }
    } catch (error) {
      console.error('Error deleting date:', error)
      setMessage({ type: 'error', text: 'Failed to delete date' })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-brown" />
      </div>
    )
  }

  // Get today's date for comparison
  const today = formatDateForInput(new Date())

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-heading text-brand-brown mb-2">
        Pickup Dates
      </h1>
      <p className="text-brand-brown/70 mb-6">
        Set specific dates when you&apos;re available for customer pickups
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
                {orderingEnabled ? 'Currently accepting orders' : 'Not accepting orders'}
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
        </div>
      </div>

      {/* Pickup Dates */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading text-brand-brown flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-pink" />
            Scheduled Pickup Dates
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-brown text-white rounded-lg
              hover:bg-brand-brown/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Date
          </button>
        </div>

        {/* Add New Date Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-brand-cream/30 rounded-lg border border-brand-brown/10">
            <h3 className="font-medium text-brand-brown mb-4">Add New Pickup Date</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Date picker */}
              <div>
                <label className="block text-sm text-brand-brown/70 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                    focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>

              {/* Open time */}
              <div>
                <label className="block text-sm text-brand-brown/70 mb-1">
                  Open Time
                </label>
                <select
                  value={newOpenTime}
                  onChange={(e) => setNewOpenTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                    focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                >
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Close time */}
              <div>
                <label className="block text-sm text-brand-brown/70 mb-1">
                  Close Time
                </label>
                <select
                  value={newCloseTime}
                  onChange={(e) => setNewCloseTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                    focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                >
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddDate}
                disabled={adding}
                className="flex items-center gap-2 px-4 py-2 bg-brand-brown text-white rounded-lg
                  hover:bg-brand-brown/90 transition-colors disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Date
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewDate('')
                  setNewOpenTime('09:00')
                  setNewCloseTime('17:00')
                }}
                className="px-4 py-2 border border-gray-200 text-brand-brown rounded-lg
                  hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dates List */}
        {dates.length === 0 ? (
          <div className="text-center py-12 text-brand-brown/60">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No pickup dates scheduled</p>
            <p className="text-sm">Add dates when you&apos;ll be available for customer pickups</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dates.map((date) => {
              const isPast = date.date < today
              const isToday = date.date === today
              const isEditing = editingId === date.id

              return (
                <div
                  key={date.id}
                  className={`p-4 rounded-lg border ${
                    isPast
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : isToday
                      ? 'bg-brand-green/5 border-brand-green/20'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Date info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isPast ? 'text-gray-500' : 'text-brand-brown'}`}>
                          {formatDate(date.date)}
                        </span>
                        {isToday && (
                          <span className="text-xs px-2 py-0.5 bg-brand-green/10 text-brand-green rounded-full">
                            Today
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">
                            Past
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time and actions */}
                    <div className="flex items-center gap-4">
                      {isEditing ? (
                        // Edit mode
                        <>
                          <div className="flex items-center gap-2">
                            <select
                              value={editOpenTime}
                              onChange={(e) => setEditOpenTime(e.target.value)}
                              className="px-2 py-1 border border-gray-200 rounded text-sm bg-white
                                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                            >
                              {TIME_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-brand-brown/60">-</span>
                            <select
                              value={editCloseTime}
                              onChange={(e) => setEditCloseTime(e.target.value)}
                              className="px-2 py-1 border border-gray-200 rounded text-sm bg-white
                                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                            >
                              {TIME_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(date.id)}
                              disabled={saving}
                              className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                              title="Save"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        // View mode
                        <>
                          <span className={`text-sm ${isPast ? 'text-gray-500' : 'text-brand-brown/70'}`}>
                            {formatTime(date.open_time)} - {formatTime(date.close_time)}
                          </span>
                          {!isPast && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(date)}
                                className="p-2 text-brand-brown/70 hover:bg-brand-brown/10 rounded-lg transition-colors"
                                title="Edit hours"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(date.id)}
                                disabled={deletingId === date.id}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === date.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Help text */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-brand-brown/60">
            <strong>Tip:</strong> Add specific dates when you&apos;ll be available for pickups.
            Customers will only see these dates when placing orders. Past dates are automatically hidden from customers.
          </p>
        </div>
      </div>
    </div>
  )
}
