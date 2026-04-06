"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  value: string // "HH:MM" 24-hour format internally
  onChange: (value: string) => void
  className?: string
}

/** Convert 24-hr "HH:MM" to display parts */
function to12hr(value: string): { hour12: string; minute: string; period: "AM" | "PM" } {
  const [hStr, mStr] = value.split(":")
  const h24 = parseInt(hStr, 10)
  const period = h24 >= 12 ? "PM" : "AM"
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return { hour12: String(h12), minute: mStr?.padStart(2, "0") ?? "00", period }
}

/** Convert 12-hr parts back to "HH:MM" 24-hour */
function to24hr(hour12: string, minute: string, period: "AM" | "PM"): string {
  let h = parseInt(hour12, 10)
  if (period === "AM" && h === 12) h = 0
  if (period === "PM" && h !== 12) h += 12
  return `${String(h).padStart(2, "0")}:${minute}`
}

const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1))
const minuteOptions = ["00", "15", "30", "45"]

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const { hour12, minute, period } = to12hr(value)

  const handleHourChange = (v: string | null) => {
    if (v) onChange(to24hr(v, minute, period))
  }
  const handleMinuteChange = (v: string | null) => {
    if (v) onChange(to24hr(hour12, v, period))
  }
  const handlePeriodChange = (v: string | null) => {
    if (v) onChange(to24hr(hour12, minute, v as "AM" | "PM"))
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select value={hour12} onValueChange={handleHourChange}>
        <SelectTrigger className="w-16">
          <SelectValue placeholder="h" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground font-medium">:</span>

      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-16">
          <SelectValue placeholder="mm" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-18">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>

      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}
