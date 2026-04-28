'use client'

import type { FC, KeyboardEvent } from 'react'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface StarInputProps {
  onSubmit?: (value: string) => void
}

const StarInput: FC<StarInputProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('')

  const submit = () => {
    const nextValue = value.trim()
    if (!nextValue) return
    onSubmit?.(nextValue)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      submit()
    }
  }

  return (
    <div className="mb-16 flex w-full max-w-2xl items-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.7)] p-2 pl-6 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-[#a78bfa] focus-within:bg-[rgba(26,26,26,0.7)]">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Capture an idea... (Press Enter to Dock)"
        className="w-full border-none bg-transparent py-3 font-sans text-lg text-white outline-none placeholder:text-[#8B8B8B]"
      />
      <button
        type="button"
        onClick={submit}
        className="ml-2 shrink-0 rounded-xl bg-[#a78bfa] p-3 text-white transition-colors hover:bg-purple-500"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  )
}

export default StarInput
