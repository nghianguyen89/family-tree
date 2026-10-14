'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, UploadCloud, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { useI18n } from '@/lib/i18n/I18nProvider'
import type { GalleryItem } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { uploadGalleryImage } from '@/utils/supabase/storage'
import { getGalleryStoragePath } from '@/utils/supabase/storage-path'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: GalleryItem | null
}

export default function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  initialData
}: UploadModalProps) {
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError(t('fileTooLarge10'))
        return
      }
      setFile(selected)
      const url = URL.createObjectURL(selected)
      setPreview(url)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped)
      setPreview(URL.createObjectURL(dropped))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialData && !file) {
      setError(t('chooseImageError'))
      return
    }
    if (!title) {
      setError(t('enterImageTitle'))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      let finalPath = initialData
        ? initialData.storage_path ||
          getGalleryStoragePath(initialData.image_url)
        : ''

      // 1. Upload to storage (only if new file selected)
      if (file) {
        const { path, error: uploadError } = await uploadGalleryImage(file)
        if (uploadError || !path) {
          throw new Error(t('uploadError'))
        }
        finalPath = path
      }

      // 2. Save to database
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      const itemData = {
        title,
        description: description || null,
        image_url: finalPath,
        event_date: eventDate || null
      }

      if (initialData) {
        // Update
        const { error: dbError } = await supabase
          .from('gallery_items')
          .update(itemData)
          .eq('id', initialData.id)
        if (dbError) throw dbError
      } else {
        // Insert
        const { error: dbError } = await supabase.from('gallery_items').insert([
          {
            ...itemData,
            created_by: userData?.user?.id || null
          }
        ])
        if (dbError) throw dbError
      }

      // Success
      resetForm()
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('systemError'))
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setTitle('')
    setDescription('')
    setEventDate('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const inputClasses =
    'bg-white text-stone-900 placeholder-stone-500 block w-full rounded-xl border border-stone-300  focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-sm px-4 py-3 transition-all outline-none!'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-100 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6'>
          {/* Click-away backdrop */}
          <div
            className='absolute inset-0 cursor-pointer'
            onClick={!isUploading ? handleClose : undefined}
          />

          <motion.div
            layout
            initial={{ scale: 0.96, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className='relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white/95 backdrop-blur-2xl'>
            {/* Sticky Header Actions */}
            <div className='absolute top-4 right-4 z-20 flex items-center gap-2 sm:top-5 sm:right-5'>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className='flex size-10 items-center justify-center rounded-full border border-stone-200/50 bg-stone-100/80 text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50'
                aria-label={t('close')}>
                <X className='size-5' />
              </button>
            </div>

            <div className='custom-scrollbar flex-1 overflow-y-auto px-4 pt-16 pb-8 sm:px-8'>
              <h2 className='mb-6 font-serif text-xl font-semibold text-stone-800'>
                {initialData ? t('editImage') : t('addToGallery')}
              </h2>

              <form
                id='upload-form'
                onSubmit={handleSubmit}
                className='space-y-6'>
                {/* Image Upload Area */}
                <div
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${preview ? 'border-stone-200 bg-stone-50' : 'border-stone-300 hover:border-pink-400 hover:bg-pink-50/50'}`}
                  onClick={() => !preview && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}>
                  {preview ? (
                    <div className='relative inline-block w-full'>
                      <Image
                        unoptimized
                        src={preview}
                        alt={t('imagePreview')}
                        width={800}
                        height={600}
                        className='mx-auto max-h-64 rounded-lg object-contain shadow-sm'
                      />
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                          setPreview(null)
                        }}
                        className='absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-stone-700 shadow-md backdrop-blur-sm hover:text-rose-600'>
                        <X className='size-4' />
                      </button>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center space-y-3'>
                      <div className='rounded-full bg-stone-100 p-4 text-stone-400'>
                        <UploadCloud className='size-8' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-stone-700'>
                          {t('chooseImage')}
                        </p>
                        <p className='mt-1 text-sm text-stone-500'>
                          {t('imageUploadHint')}
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleFileChange}
                  />
                </div>

                {error && (
                  <div className='rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600'>
                    {error}
                  </div>
                )}

                {/* Fields */}
                <div className='space-y-4'>
                  <div>
                    <label className='mb-1.5 block text-sm font-medium text-stone-700'>
                      {t('imageTitle')} <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClasses}
                      placeholder={t('imageTitlePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className='mb-1.5 block text-sm font-medium text-stone-700'>
                      {t('eventDate')}
                    </label>
                    <input
                      type='date'
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className='mb-1.5 block text-sm font-medium text-stone-700'>
                      {t('eventDescription')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`${inputClasses} resize-none`}
                      placeholder={t('descriptionPlaceholder')}
                    />
                  </div>
                </div>

                <div className='flex justify-end gap-3 border-t border-stone-100 pt-4'>
                  <button
                    type='button'
                    onClick={handleClose}
                    disabled={isUploading}
                    className='btn'>
                    {t('restoreCancel')}
                  </button>
                  <button
                    type='submit'
                    form='upload-form'
                    disabled={isUploading || (!initialData && !file) || !title}
                    className='btn-primary flex items-center gap-2'>
                    {isUploading ? (
                      <>
                        <Loader2 className='size-4 animate-spin' />
                        {t('savingEvent')}
                      </>
                    ) : initialData ? (
                      t('saveChanges')
                    ) : (
                      t('saveImage')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
