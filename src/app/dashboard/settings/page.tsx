'use client'

import { useState, useEffect, useRef } from 'react'
import {
  DollarSign,
  Milk,
  Hash,
  QrCode,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import Image from 'next/image'
import type { MilkOption } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  // Settings state
  const [globalMilkOptions, setGlobalMilkOptions] = useState<MilkOption[]>([])
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(0)
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = useState<number>(2)
  const [venmoUsername, setVenmoUsername] = useState<string>('')
  const [cashappUsername, setCashappUsername] = useState<string>('')
  const [venmoQrUrl, setVenmoQrUrl] = useState<string>('')
  const [cashappQrUrl, setCashappQrUrl] = useState<string>('')

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingVenmo, setUploadingVenmo] = useState(false)
  const [uploadingCashapp, setUploadingCashapp] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newMilkName, setNewMilkName] = useState('')
  const [newMilkPrice, setNewMilkPrice] = useState('')

  // Refs for file inputs
  const venmoFileRef = useRef<HTMLInputElement>(null)
  const cashappFileRef = useRef<HTMLInputElement>(null)

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          const settings = data.settings

          // Parse settings - value column is JSONB so it returns proper types
          const milkOptions = settings.global_milk_options
          if (Array.isArray(milkOptions)) {
            setGlobalMilkOptions(milkOptions)
          } else if (typeof milkOptions === 'string') {
            // Fallback for legacy data that may have been double-stringified
            try {
              const parsed = JSON.parse(milkOptions)
              setGlobalMilkOptions(Array.isArray(parsed) ? parsed : [])
            } catch {
              setGlobalMilkOptions([])
            }
          } else {
            // No milk options in database - start with empty array
            setGlobalMilkOptions([])
          }
          setDefaultTaxRate(Number(settings.default_tax_rate) || 0)
          setMaxOrdersPerSlot(Number(settings.max_orders_per_slot) || 2)
          setVenmoUsername(settings.venmo_username || '')
          setCashappUsername(settings.cashapp_username || '')
          setVenmoQrUrl(settings.venmo_qr_url || '')
          setCashappQrUrl(settings.cashapp_qr_url || '')
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Save a single setting
  async function saveSetting(key: string, value: unknown) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    return res.ok
  }

  // Save all settings
  async function handleSaveAll() {
    setSaving(true)
    setMessage(null)

    try {
      const results = await Promise.all([
        saveSetting('global_milk_options', globalMilkOptions),
        saveSetting('default_tax_rate', defaultTaxRate),
        saveSetting('max_orders_per_slot', maxOrdersPerSlot),
        saveSetting('venmo_username', venmoUsername),
        saveSetting('cashapp_username', cashappUsername),
      ])

      if (results.every(r => r)) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
      } else {
        setMessage({ type: 'error', text: 'Some settings failed to save' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  // Add new milk option
  function handleAddMilkOption() {
    if (!newMilkName.trim()) return

    const priceAdjustment = parseFloat(newMilkPrice) || 0
    setGlobalMilkOptions(prev => [
      ...prev,
      { name: newMilkName.trim(), priceAdjustment }
    ])
    setNewMilkName('')
    setNewMilkPrice('')
  }

  // Remove milk option
  function handleRemoveMilkOption(index: number) {
    setGlobalMilkOptions(prev => prev.filter((_, i) => i !== index))
  }

  // Update milk option price
  function handleUpdateMilkPrice(index: number, price: string) {
    setGlobalMilkOptions(prev =>
      prev.map((option, i) =>
        i === index ? { ...option, priceAdjustment: parseFloat(price) || 0 } : option
      )
    )
  }

  // Upload QR code image
  async function handleUploadQR(file: File, type: 'venmo' | 'cashapp') {
    const setUploading = type === 'venmo' ? setUploadingVenmo : setUploadingCashapp
    const setUrl = type === 'venmo' ? setVenmoQrUrl : setCashappQrUrl

    setUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-qr-${Date.now()}.${fileExt}`

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('payment-qr-codes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-qr-codes')
        .getPublicUrl(data.path)

      const publicUrl = urlData.publicUrl

      // Save to settings
      const saved = await saveSetting(`${type}_qr_url`, publicUrl)
      if (saved) {
        setUrl(publicUrl)
        setMessage({ type: 'success', text: `${type === 'venmo' ? 'Venmo' : 'Cash App'} QR code uploaded` })
      }
    } catch (error) {
      console.error('Error uploading QR:', error)
      setMessage({ type: 'error', text: `Failed to upload ${type} QR code` })
    } finally {
      setUploading(false)
    }
  }

  // Remove QR code
  async function handleRemoveQR(type: 'venmo' | 'cashapp') {
    const setUrl = type === 'venmo' ? setVenmoQrUrl : setCashappQrUrl

    try {
      await saveSetting(`${type}_qr_url`, '')
      setUrl('')
      setMessage({ type: 'success', text: `${type === 'venmo' ? 'Venmo' : 'Cash App'} QR code removed` })
    } catch (error) {
      console.error('Error removing QR:', error)
    }
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
        Settings
      </h1>
      <p className="text-brand-brown/70 mb-6">
        Configure pricing, taxes, and payment options
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

      {/* Global Milk Options */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-heading text-brand-brown mb-4 flex items-center gap-2">
          <Milk className="w-5 h-5 text-brand-pink" />
          Global Milk Prices
        </h2>
        <p className="text-sm text-brand-brown/70 mb-4">
          These prices apply to all products. Individual products can have different milk options available.
        </p>

        <div className="space-y-3 mb-4">
          {globalMilkOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="flex-1 text-brand-brown">{option.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-brand-brown/60">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={option.priceAdjustment}
                  onChange={(e) => handleUpdateMilkPrice(index, e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-200 rounded text-right
                    focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                />
              </div>
              <button
                onClick={() => handleRemoveMilkOption(index)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new milk option */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <input
            type="text"
            placeholder="Milk name"
            value={newMilkName}
            onChange={(e) => setNewMilkName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
          />
          <div className="flex items-center gap-1">
            <span className="text-brand-brown/60">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newMilkPrice}
              onChange={(e) => setNewMilkPrice(e.target.value)}
              className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-right
                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
            />
          </div>
          <button
            onClick={handleAddMilkOption}
            disabled={!newMilkName.trim()}
            className="p-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tax & Order Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-heading text-brand-brown mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-green" />
          Tax & Order Limits
        </h2>

        <div className="space-y-4">
          {/* Default Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-1">
              Default Tax Rate (%)
            </label>
            <p className="text-xs text-brand-brown/60 mb-2">
              Applied to products without a specific tax rate
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
            />
          </div>

          {/* Max Orders Per Slot */}
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-1">
              Max Orders per 15-min Slot
            </label>
            <p className="text-xs text-brand-brown/60 mb-2">
              Limits how many orders can be placed for each pickup time
            </p>
            <input
              type="number"
              min="1"
              max="100"
              value={maxOrdersPerSlot}
              onChange={(e) => setMaxOrdersPerSlot(parseInt(e.target.value) || 2)}
              className="w-32 px-3 py-2 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-heading text-brand-brown mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-500" />
          Payment Usernames
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-1">
              Venmo Username
            </label>
            <input
              type="text"
              placeholder="@username"
              value={venmoUsername}
              onChange={(e) => setVenmoUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-1">
              Cash App Username
            </label>
            <input
              type="text"
              placeholder="$cashtag"
              value={cashappUsername}
              onChange={(e) => setCashappUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
            />
          </div>
        </div>
      </div>

      {/* QR Code Images */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-heading text-brand-brown mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-purple-500" />
          Payment QR Codes
        </h2>
        <p className="text-sm text-brand-brown/70 mb-4">
          Upload QR code images for customers to scan when paying
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Venmo QR */}
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-2">
              Venmo QR Code
            </label>
            {venmoQrUrl ? (
              <div className="relative inline-block">
                <Image
                  src={venmoQrUrl}
                  alt="Venmo QR Code"
                  width={150}
                  height={150}
                  className="rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => handleRemoveQR('venmo')}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full
                    hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={venmoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadQR(file, 'venmo')
                  }}
                />
                <button
                  onClick={() => venmoFileRef.current?.click()}
                  disabled={uploadingVenmo}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300
                    rounded-lg text-brand-brown/70 hover:border-brand-brown hover:text-brand-brown
                    transition-colors disabled:opacity-50"
                >
                  {uploadingVenmo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {uploadingVenmo ? 'Uploading...' : 'Upload Venmo QR'}
                </button>
              </div>
            )}
          </div>

          {/* Cash App QR */}
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-2">
              Cash App QR Code
            </label>
            {cashappQrUrl ? (
              <div className="relative inline-block">
                <Image
                  src={cashappQrUrl}
                  alt="Cash App QR Code"
                  width={150}
                  height={150}
                  className="rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => handleRemoveQR('cashapp')}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full
                    hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={cashappFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadQR(file, 'cashapp')
                  }}
                />
                <button
                  onClick={() => cashappFileRef.current?.click()}
                  disabled={uploadingCashapp}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300
                    rounded-lg text-brand-brown/70 hover:border-brand-brown hover:text-brand-brown
                    transition-colors disabled:opacity-50"
                >
                  {uploadingCashapp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {uploadingCashapp ? 'Uploading...' : 'Upload Cash App QR'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-3 bg-brand-brown text-white font-medium rounded-lg
            hover:bg-brand-brown/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save All Settings'
          )}
        </button>
      </div>
    </div>
  )
}
