"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:           "flex flex-col sm:flex-row gap-4",
        month:            "flex flex-col gap-4",
        caption:          "flex justify-center pt-1 relative items-center w-full",
        caption_label:    "text-sm font-medium text-[#1A1916]",
        nav:              "flex items-center gap-1",
        nav_button:       cn("h-7 w-7 bg-transparent p-0 rounded-md border border-[#E5E2DC] flex items-center justify-center hover:bg-[#F5F4F1] transition-colors"),
        nav_button_previous: "absolute left-1",
        nav_button_next:     "absolute right-1",
        table:            "w-full border-collapse",
        head_row:         "flex",
        head_cell:        "text-[#A8A39C] rounded-md w-8 font-normal text-[0.75rem] flex-1 text-center",
        row:              "flex w-full mt-1",
        cell:             cn("relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#EBF3FC] [&:has([aria-selected].day-outside)]:bg-[#EBF3FC]/50 [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"),
        day:              cn("h-8 w-full p-0 font-normal rounded-md hover:bg-[#F5F4F1] transition-colors aria-selected:opacity-100 text-[13px]"),
        day_range_start:  "day-range-start",
        day_range_end:    "day-range-end",
        day_selected:     "bg-[#0474C4] text-white hover:bg-[#0474C4] hover:text-white focus:bg-[#0474C4] focus:text-white rounded-md",
        day_today:        "bg-[#F5F4F1] text-[#1A1916] font-semibold",
        day_outside:      "day-outside text-[#A8A39C] opacity-50",
        day_disabled:     "text-[#A8A39C] opacity-30",
        day_range_middle: "aria-selected:bg-[#EBF3FC] aria-selected:text-[#1A1916]",
        day_hidden:       "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
