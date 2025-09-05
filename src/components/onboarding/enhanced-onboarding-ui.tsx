"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, Save, AlertCircle, Cloud, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  message?: string
}

export function SaveIndicator({ status, message }: SaveIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg",
          status === 'idle' && "bg-gray-100 text-gray-600",
          status === 'saving' && "bg-blue-100 text-blue-700",
          status === 'saved' && "bg-green-100 text-green-700",
          status === 'error' && "bg-red-100 text-red-700"
        )}
      >
        {status === 'idle' && (
          <>
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">Not saved</span>
          </>
        )}
        {status === 'saving' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </>
        )}
        {status === 'saved' && (
          <>
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Saved</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{message || 'Save failed'}</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

interface FieldFeedbackProps {
  isValid: boolean
  isTouched: boolean
  errorMessage?: string
  successMessage?: string
}

export function FieldFeedback({ isValid, isTouched, errorMessage, successMessage }: FieldFeedbackProps) {
  if (!isTouched) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-1"
    >
      {!isValid && errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </p>
      )}
      {isValid && successMessage && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {successMessage}
        </p>
      )}
    </motion.div>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  helpText?: string
  validation?: (value: string) => { isValid: boolean; message?: string }
  onSave?: () => void
}

export function EnhancedFormField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  helpText,
  validation,
  onSave
}: FormFieldProps) {
  const [isTouched, setIsTouched] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string>()
  
  useEffect(() => {
    if (validation && isTouched) {
      const result = validation(value)
      setIsValid(result.isValid)
      setErrorMessage(result.message)
    }
  }, [value, validation, isTouched])
  
  const handleBlur = () => {
    setIsTouched(true)
    if (onSave && value) {
      onSave()
    }
  }
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all",
              isTouched && !isValid ? "border-red-300" : "border-gray-300",
              isTouched && isValid && value ? "border-green-300" : ""
            )}
            rows={4}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all",
              isTouched && !isValid ? "border-red-300" : "border-gray-300",
              isTouched && isValid && value ? "border-green-300" : ""
            )}
          />
        )}
        {isTouched && isValid && value && (
          <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
        )}
      </div>
      {helpText && !isTouched && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
      <FieldFeedback
        isValid={isValid}
        isTouched={isTouched}
        errorMessage={errorMessage}
        successMessage={isValid && value ? "Looking good!" : undefined}
      />
    </div>
  )
}

interface ProgressTrackerProps {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  stepLabels: string[]
}

export function ProgressTracker({ currentStep, totalSteps, completedSteps, stepLabels }: ProgressTrackerProps) {
  return (
    <div className="fixed left-0 top-20 z-40 bg-white/95 backdrop-blur-sm shadow-sm w-full py-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-purple-600">
            {Math.round((completedSteps.length / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex" aria-hidden="true">
            <div className="h-2 w-full bg-gray-200 rounded-full" />
          </div>
          <div
            className="absolute inset-0 flex"
            style={{ width: `${(completedSteps.length / totalSteps) * 100}%` }}
          >
            <div className="h-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          </div>
          <div className="relative flex justify-between">
            {stepLabels.map((label, index) => (
              <div
                key={index}
                className="flex flex-col items-center"
                style={{ width: `${100 / totalSteps}%` }}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center bg-white transition-all",
                    completedSteps.includes(label)
                      ? "border-green-500 text-green-500"
                      : index === currentStep
                      ? "border-purple-500 text-purple-500 ring-4 ring-purple-100"
                      : "border-gray-300 text-gray-300"
                  )}
                >
                  {completedSteps.includes(label) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-medium",
                    completedSteps.includes(label)
                      ? "text-green-600"
                      : index === currentStep
                      ? "text-purple-600"
                      : "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AnimatedCardProps {
  children: React.ReactNode
  delay?: number
}

export function AnimatedCard({ children, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      {children}
    </motion.div>
  )
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-lg font-medium">Processing your information...</span>
        </div>
      </div>
    </div>
  )
}
