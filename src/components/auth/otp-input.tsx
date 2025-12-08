'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
}

export function OTPInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [values, setValues] = useState<string[]>(
    value.split('').concat(Array(length).fill('')).slice(0, length)
  )

  // Update values when prop value changes
  if (value !== values.join('')) {
    const newValues = value.split('').concat(Array(length).fill('')).slice(0, length)
    setValues(newValues)
  }

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) {
      return
    }

    const newValues = [...values]
    newValues[index] = newValue
    setValues(newValues)

    const otpValue = newValues.join('')
    onChange(otpValue)

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all fields are filled
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // If current field is empty, focus previous and clear it
        const newValues = [...values]
        newValues[index - 1] = ''
        setValues(newValues)
        inputRefs.current[index - 1]?.focus()
        onChange(newValues.join(''))
      } else {
        // Clear current field
        const newValues = [...values]
        newValues[index] = ''
        setValues(newValues)
        onChange(newValues.join(''))
      }
    }

    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()

    // Only allow digits
    const digits = pastedData.replace(/\D/g, '').slice(0, length)

    if (digits) {
      const newValues = digits.split('').concat(Array(length).fill('')).slice(0, length)
      setValues(newValues)
      onChange(digits)

      // Focus the last filled input or the last input if all are filled
      const focusIndex = Math.min(digits.length, length - 1)
      inputRefs.current[focusIndex]?.focus()

      // Call onComplete if all fields are filled
      if (digits.length === length && onComplete) {
        onComplete(digits)
      }
    }
  }

  const handleFocus = (index: number) => {
    // Select all text in the input when focused
    inputRefs.current[index]?.select()
  }

  return (
    <div className="flex gap-3 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className="w-14 h-14 text-center text-2xl font-bold bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white rounded-lg border-2 border-gray-300 dark:border-dark-700 focus:border-primary-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  )
}
