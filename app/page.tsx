'use client'

import { useState, useEffect, useCallback } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, X, Shield, AlertCircle, Mail, Copy, CheckCircle, Bell, User, Plus, FileText, Trash2 } from 'lucide-react'

// TypeScript Interfaces from Test Response Data
interface WarrantyProduct {
  id: string
  brand: string
  product_name: string
  purchase_date: string
  invoice_id: string
  warranty_end_date: string
  warranty_period_months: number
  status_color: 'GREEN' | 'YELLOW' | 'RED'
  status_message: string
  days_remaining: number
  overall_confidence: number
  verification_required: boolean
  fields_to_verify: string[]
  alert_trigger: boolean
  created_at: string
}

interface ClaimEmailData {
  email_subject: string
  email_body: string
  recipient_email: string
  cc_emails?: string[]
  legal_references: string
  service_center_name?: string
  service_center_address?: string
  service_center_phone?: string
  service_center_distance_km?: number
  attachments_required?: string[]
  expected_response_days?: number
  escalation_options?: string[]
}

type FilterType = 'all' | 'active' | 'expiring' | 'expired'

// Notification Component (replacing toast/sonner)
function Notification({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-emerald-500/10 border-emerald-500' : type === 'error' ? 'bg-red-500/10 border-red-500' : 'bg-blue-500/10 border-blue-500'
  const icon = type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <AlertCircle className="w-5 h-5 text-blue-500" />

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor} backdrop-blur-md shadow-lg animate-in slide-in-from-top-5`}>
      {icon}
      <span className="text-white text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Countdown Ring Component
function CountdownRing({ daysRemaining, totalDays, statusColor }: { daysRemaining: number; totalDays: number; statusColor: string }) {
  const percentage = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100))
  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
  const gradient = statusColor === 'GREEN'
    ? { from: '#10b981', to: '#14b8a6' }
    : statusColor === 'YELLOW'
    ? { from: '#f59e0b', to: '#f97316' }
    : { from: '#ef4444', to: '#f87171' }

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="#1a1f36"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ filter: 'drop-shadow(0 0 8px rgba(79, 124, 255, 0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-xs font-semibold">{daysRemaining}d</span>
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ statusColor, statusMessage, pulse = false }: { statusColor: string; statusMessage: string; pulse?: boolean }) {
  const bgClass = statusColor === 'GREEN'
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
    : statusColor === 'YELLOW'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'bg-gradient-to-r from-red-400 to-red-500'

  return (
    <Badge className={`${bgClass} text-white border-0 shadow-lg ${pulse ? 'animate-pulse' : ''}`}>
      {statusMessage}
    </Badge>
  )
}

// Product Card Component
function ProductCard({ product, onView, onClaim, onDelete }: { product: WarrantyProduct; onView: () => void; onClaim: () => void; onDelete: () => void }) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          {product.verification_required && (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 animate-pulse">
              Please verify
            </Badge>
          )}
        </div>
        <CardTitle className="text-white text-lg">{product.product_name}</CardTitle>
        <p className="text-white/60 text-sm">{product.brand}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs">Days Remaining</p>
            <p className="text-white text-sm font-medium">{product.days_remaining} days</p>
          </div>
          <CountdownRing
            daysRemaining={product.days_remaining}
            totalDays={product.warranty_period_months * 30}
            statusColor={product.status_color}
          />
        </div>

        <StatusBadge
          statusColor={product.status_color}
          statusMessage={product.status_message}
        />

        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-white/60">
            <span>Purchased:</span>
            <span className="text-white/80">{new Date(product.purchase_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Expires:</span>
            <span className="text-white/80">{new Date(product.warranty_end_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Invoice:</span>
            <span className="text-white/80">{product.invoice_id}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onClaim}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <Mail className="w-4 h-4 mr-2" />
            Fix it
          </Button>
          <Button
            onClick={onView}
            variant="outline"
            size="icon"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            size="icon"
            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Upload Modal Component
function UploadModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = async (file: File) => {
    setError(null)

    // Validate file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, or PNG file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    setProgress(10)

    try {
      // Upload file
      setProgress(30)
      const uploadResult = await uploadFiles(file)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      setProgress(50)

      // Process with Warranty Orchestrator
      const message = `Process this uploaded invoice for warranty tracking. Extract product details and calculate warranty information.`
      const result = await callAIAgent(message, '698599787551cb7920ffe918', {
        assets: uploadResult.asset_ids
      })

      setProgress(80)

      if (!result.success) {
        throw new Error(result.error || 'Processing failed')
      }

      // Save to database
      const responseData = result.response.result || result.response
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: responseData.brand,
          product_name: responseData.product_name,
          purchase_date: responseData.purchase_date,
          invoice_id: responseData.invoice_id,
          warranty_end_date: responseData.warranty_end_date,
          warranty_period_months: responseData.warranty_period_months,
          status_color: responseData.status_color,
          status_message: responseData.status_message,
          days_remaining: responseData.days_remaining,
          overall_confidence: responseData.overall_confidence,
          verification_required: responseData.verification_required,
          fields_to_verify: responseData.fields_to_verify || []
        })
      })

      setProgress(100)

      setTimeout(() => {
        onSuccess()
        onClose()
        resetModal()
      }, 500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const resetModal = () => {
    setSelectedFile(null)
    setIsProcessing(false)
    setProgress(0)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetModal() } }}>
      <DialogContent className="bg-[#1a1f36] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Upload Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isProcessing && !error && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-105'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">Drop your invoice here</h3>
              <p className="text-white/60 mb-4">or click to browse</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </span>
                </Button>
              </label>
              <p className="text-white/40 text-xs mt-4">PDF, JPG, PNG (Max 10MB)</p>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-24 h-24 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-400">{progress}%</span>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-white font-medium">
                  {progress < 40 ? 'Uploading invoice...' : progress < 70 ? 'Extracting details...' : 'Processing warranty...'}
                </p>
                <p className="text-white/60 text-sm">{selectedFile?.name}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Upload Failed</p>
                <p className="text-red-300/80 text-sm mt-1">{error}</p>
                <Button
                  onClick={resetModal}
                  variant="outline"
                  className="mt-3 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Product Detail Modal Component
function ProductDetailModal({ product, isOpen, onClose, onUpdate }: { product: WarrantyProduct | null; isOpen: boolean; onClose: () => void; onUpdate: () => void }) {
  const [editedFields, setEditedFields] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (product && product.verification_required) {
      const fields: Record<string, string> = {}
      product.fields_to_verify.forEach(field => {
        fields[field] = (product as any)[field] || ''
      })
      setEditedFields(fields)
    }
  }, [product])

  const handleConfirm = async () => {
    if (!product) return

    setIsSaving(true)
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedFields,
          verification_required: false,
          fields_to_verify: []
        })
      })
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Failed to update product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!product) return null

  const totalDays = product.warranty_period_months * 30
  const usedDays = totalDays - product.days_remaining
  const progressPercentage = (usedDays / totalDays) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f36] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold">{product.product_name}</DialogTitle>
              <p className="text-white/60">{product.brand}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <CountdownRing
              daysRemaining={product.days_remaining}
              totalDays={totalDays}
              statusColor={product.status_color}
            />
            <StatusBadge
              statusColor={product.status_color}
              statusMessage={product.status_message}
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
            <div>
              <p className="text-white/40 text-xs mb-1">Invoice ID</p>
              <p className="text-white font-medium">{product.invoice_id}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Confidence</p>
              <p className="text-white font-medium">{(product.overall_confidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Purchase Date</p>
              <p className="text-white font-medium">{new Date(product.purchase_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Warranty Ends</p>
              <p className="text-white font-medium">{new Date(product.warranty_end_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Warranty Timeline */}
          <div className="space-y-2">
            <p className="text-white/60 text-sm">Warranty Timeline</p>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Purchase</span>
              <span className="text-white/80">Today</span>
              <span>Expiry</span>
            </div>
          </div>

          {/* Verification Section */}
          {product.verification_required && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-medium">Please verify these details</p>
              </div>
              {product.fields_to_verify.map(field => (
                <div key={field}>
                  <Label className="text-white/80 text-sm">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                  <Input
                    value={editedFields[field] || ''}
                    onChange={(e) => setEditedFields(prev => ({ ...prev, [field]: e.target.value }))}
                    className="mt-1 bg-white/5 border-white/20 text-white"
                  />
                </div>
              ))}
              <Button
                onClick={handleConfirm}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Details
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Claim Email Modal Component
function ClaimEmailModal({ product, isOpen, onClose }: { product: WarrantyProduct | null; isOpen: boolean; onClose: () => void }) {
  const [emailData, setEmailData] = useState<ClaimEmailData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [issue, setIssue] = useState('')

  useEffect(() => {
    if (isOpen && product && !emailData) {
      generateEmail()
    }
  }, [isOpen, product])

  const generateEmail = async () => {
    if (!product) return

    setIsGenerating(true)
    try {
      const message = `Draft warranty claim for: Brand: ${product.brand}, Product: ${product.product_name}, Purchase Date: ${product.purchase_date}, Warranty End: ${product.warranty_end_date}, Issue: ${issue || 'Product malfunction'}, Invoice ID: ${product.invoice_id}`

      const result = await callAIAgent(message, '69859953ab4bf65a66ad08d3')

      if (result.success) {
        const data = result.response.result || result.response
        // Handle both wrapped and unwrapped responses
        const claimData: ClaimEmailData = {
          email_subject: data.email_subject || `Warranty Claim for ${product.product_name}`,
          email_body: data.email_body || '',
          recipient_email: data.recipient_email || '',
          cc_emails: data.cc_emails,
          legal_references: data.legal_references || '',
          service_center_name: data.service_center_name,
          service_center_address: data.service_center_address,
          service_center_phone: data.service_center_phone,
          service_center_distance_km: data.service_center_distance_km,
          attachments_required: data.attachments_required,
          expected_response_days: data.expected_response_days,
          escalation_options: data.escalation_options
        }
        setEmailData(claimData)
      }
    } catch (error) {
      console.error('Failed to generate email:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!emailData) return

    const fullEmail = `To: ${emailData.recipient_email}\nSubject: ${emailData.email_subject}\n\n${emailData.email_body}`

    try {
      await navigator.clipboard.writeText(fullEmail)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      // Fallback for iframe context
      const textArea = document.createElement('textarea')
      textArea.value = fullEmail
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleOpenEmail = () => {
    if (!emailData) return

    const mailto = `mailto:${emailData.recipient_email}?subject=${encodeURIComponent(emailData.email_subject)}&body=${encodeURIComponent(emailData.email_body)}`
    window.location.href = mailto
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f36] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Warranty Claim Email</DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-white/60">Drafting your claim email...</span>
          </div>
        ) : emailData ? (
          <div className="space-y-6">
            {/* Email Preview Card */}
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 space-y-3">
                <div>
                  <p className="text-white/40 text-xs mb-1">To</p>
                  <p className="text-white font-medium">{emailData.recipient_email}</p>
                </div>
                {emailData.cc_emails && emailData.cc_emails.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs mb-1">CC</p>
                    <p className="text-white/60 text-sm">{emailData.cc_emails.join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-white/40 text-xs mb-1">Subject</p>
                  <p className="text-white font-medium">{emailData.email_subject}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="prose prose-invert max-w-none">
                  {emailData.email_body.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-white/80 text-sm mb-3 whitespace-pre-wrap">
                      {paragraph.includes('Consumer Protection Act') ? (
                        <span className="bg-yellow-500/20 border-l-2 border-yellow-500 pl-2 py-1 block">
                          {paragraph}
                        </span>
                      ) : paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {emailData.attachments_required && emailData.attachments_required.length > 0 && (
                <div className="px-4 pb-4">
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Attachments: {emailData.attachments_required.join(', ')}
                  </Badge>
                </div>
              )}
            </div>

            {/* Service Center Info */}
            {emailData.service_center_name && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-medium mb-2">Nearest Service Center</p>
                <div className="space-y-1 text-sm text-white/80">
                  <p>{emailData.service_center_name}</p>
                  {emailData.service_center_address && <p>{emailData.service_center_address}</p>}
                  {emailData.service_center_phone && <p>{emailData.service_center_phone}</p>}
                  {emailData.service_center_distance_km && (
                    <p className="text-white/60">{emailData.service_center_distance_km} km away</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                {isCopied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {isCopied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button
                onClick={handleOpenEmail}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Open in Email
              </Button>
            </div>

            {/* Additional Info */}
            {emailData.expected_response_days && (
              <p className="text-white/60 text-xs text-center">
                Expected response within {emailData.expected_response_days} days
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            Failed to generate email. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Main App Component
export default function Home() {
  const [products, setProducts] = useState<WarrantyProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<WarrantyProduct[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<WarrantyProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    let filtered = products
    if (filter === 'active') {
      filtered = products.filter(p => p.status_color === 'GREEN')
    } else if (filter === 'expiring') {
      filtered = products.filter(p => p.status_color === 'YELLOW')
    } else if (filter === 'expired') {
      filtered = products.filter(p => p.status_color === 'RED')
    }
    setFilteredProducts(filtered)
  }, [products, filter])

  const handleDeleteProduct = async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      setProducts(prev => prev.filter(p => p.id !== productId))
      setNotification({ message: 'Product deleted successfully', type: 'success' })
    } catch (error) {
      setNotification({ message: 'Failed to delete product', type: 'error' })
    }
  }

  const filterCounts = {
    all: products.length,
    active: products.filter(p => p.status_color === 'GREEN').length,
    expiring: products.filter(p => p.status_color === 'YELLOW').length,
    expired: products.filter(p => p.status_color === 'RED').length
  }

  return (
    <div className="min-h-screen bg-[#1a1f36]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1f36]/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-white">Warranty Guardian</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['all', 'active', 'expiring', 'expired'] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                filter === filterType
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              <Badge
                variant="secondary"
                className="ml-2 bg-white/20 text-white border-0"
              >
                {filterCounts[filterType]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10 animate-pulse">
                <CardHeader>
                  <div className="w-12 h-12 bg-white/10 rounded-lg mb-2" />
                  <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-white/10 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 bg-white/5 rounded-full mb-6">
              <FileText className="w-16 h-16 text-white/40" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">No warranties yet</h2>
            <p className="text-white/60 mb-6">Drop your first invoice to get started</p>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Invoice
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => {
                  setSelectedProduct(product)
                  setIsDetailModalOpen(true)
                }}
                onClaim={() => {
                  setSelectedProduct(product)
                  setIsClaimModalOpen(true)
                }}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {products.length > 0 && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchProducts()
          setNotification({ message: 'Invoice processed successfully!', type: 'success' })
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedProduct(null)
        }}
        onUpdate={() => {
          fetchProducts()
          setNotification({ message: 'Product updated successfully', type: 'success' })
        }}
      />

      <ClaimEmailModal
        product={selectedProduct}
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false)
          setSelectedProduct(null)
        }}
      />

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
