"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value: string // "HH:mm" format
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
const minutes = ["00", "15", "30", "45"]

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hour, minute] = value.split(":")

  const formatDisplay = (time: string) => {
    if (!time) return placeholder
    const [h, m] = time.split(":")
    const hourNum = parseInt(h, 10)
    const ampm = hourNum >= 12 ? "PM" : "AM"
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${displayHour}:${m} ${ampm}`
  }

  const handleTimeSelect = (newHour: string, newMinute: string) => {
    onChange(`${newHour}:${newMinute}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:border-primary/40",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">{formatDisplay(value)}</span>
        <Clock className="h-4 w-4 opacity-50 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="flex">
          <ScrollArea className="h-60 flex-1 border-r">
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Hour</p>
              {hours.map((h) => (
                <Button
                  key={h}
                  variant={h === hour ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-center text-sm h-8",
                    h === hour && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleTimeSelect(h, minute || "00")}
                >
                  {parseInt(h, 10) === 0
                    ? "12 AM"
                    : parseInt(h, 10) < 12
                    ? `${parseInt(h, 10)} AM`
                    : parseInt(h, 10) === 12
                    ? "12 PM"
                    : `${parseInt(h, 10) - 12} PM`}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="h-60 flex-1">
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Minute</p>
              {minutes.map((m) => (
                <Button
                  key={m}
                  variant={m === minute ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-center text-sm h-8",
                    m === minute && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleTimeSelect(hour || "09", m)}
                >
                  :{m}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
