"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const inputValue = date ? format(date, "yyyy-MM-dd") : ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) {
      onDateChange(undefined)
    } else {
      // Parse as local date to avoid timezone shifting
      const [y, m, d] = val.split("-").map(Number)
      const parsed = new Date(y, m - 1, d)
      onDateChange(isNaN(parsed.getTime()) ? undefined : parsed)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => inputRef.current?.showPicker?.()}
      >
        <span className={cn(!date && "text-muted-foreground")}>
          {date ? format(date, "PPP") : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
      </div>
      <input
        ref={inputRef}
        type="date"
        value={inputValue}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        tabIndex={-1}
      />
    </div>
  )
}
