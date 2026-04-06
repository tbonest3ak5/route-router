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
  value: string // "HH:MM" format
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, minutes] = value.split(":").map((v) => v.padStart(2, "0"))

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minutes}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hours}:${newMinute}`)
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  )
  
  const minuteOptions = ["00", "15", "30", "45"]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 flex-1">
        <Select value={hours} onValueChange={handleHourChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground font-medium">:</span>
        <Select value={minutes} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}
