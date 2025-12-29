'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  category?: string
  useS3?: boolean
  className?: string
  disabled?: boolean
  maxSizeMB?: number
}

export function ImageUpload({
  value,
  onChange,
  category = 'customers',
  useS3 = true,
  className = '',
  disabled = false,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`L'image est trop volumineuse. Maximum ${maxSizeMB} Mo`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      if (useS3) {
        formData.append('useS3', 'true')
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        onChange(data.url)
        toast.success('Image téléchargée avec succès')
      } else {
        toast.error(data.error || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }, [category, useS3, maxSizeMB, onChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || uploading) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }, [disabled, uploading, handleUpload])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }, [handleUpload])

  const handleRemove = useCallback(() => {
    onChange(null)
  }, [onChange])

  const openFilePicker = useCallback(() => {
    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }, [disabled, uploading])

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        // Preview with remove button
        <div className="relative inline-block">
          <img
            src={value}
            alt="Aperçu"
            className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 dark:border-dark-700"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-avatar.png'
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              title="Supprimer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled || uploading}
            className="absolute -bottom-2 -right-2 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors disabled:opacity-50"
            title="Changer l'image"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : (
        // Upload zone
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`
            relative flex flex-col items-center justify-center
            w-full h-40 border-2 border-dashed rounded-lg cursor-pointer
            transition-colors duration-200
            ${dragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin mb-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Téléchargement...
              </span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-gray-100 dark:bg-dark-800 rounded-full mb-3">
                <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span className="font-medium text-primary-500">Cliquez pour parcourir</span>
                {' '}ou glissez-déposez
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF ou WebP (max. {maxSizeMB} Mo)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
