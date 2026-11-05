"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * The month grid, styled for this project.
 *
 * The class keys below are react-day-picker v9's (`UI`, `DayFlag`,
 * `SelectionState`). This file previously used v8's — `nav_button`,
 * `head_cell`, `day_selected`, `cell`, `row` and the rest — which v9 silently
 * ignores, so every one of them was dead and the calendar rendered with the
 * library's bare defaults. Nothing imported it, so nothing looked wrong.
 *
 * In v9 `day` is the grid cell and `day_button` is the control inside it, so
 * sizing goes on the button and selection background on the cell.
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:        "flex flex-col gap-4",
        month:         "flex flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-[13.5px] font-bold text-[#171C35]",

        nav:             "absolute inset-x-3 top-3 flex h-8 items-center justify-between",
        button_previous: "grid h-7 w-7 place-items-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors",
        button_next:     "grid h-7 w-7 place-items-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors",
        chevron:         "h-3.5 w-3.5 fill-current",

        month_grid: "w-full border-collapse",
        weekdays:   "flex",
        weekday:    "flex-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#8A90A6] pb-1.5",
        week:       "flex w-full mt-0.5",

        day:        "relative flex-1 p-0 text-center",
        day_button: "mx-auto grid h-8 w-8 place-items-center rounded-[8px] text-[13px] font-semibold text-[#171C35] hover:bg-[#F0EFFA] cursor-pointer transition-colors disabled:cursor-not-allowed",

        selected: "[&_button]:bg-[#6655DF] [&_button]:text-white [&_button]:hover:bg-[#2C2368]",
        today:    "[&_button]:ring-1 [&_button]:ring-inset [&_button]:ring-[#6655DF]/40 [&_button]:font-extrabold",
        outside:  "[&_button]:text-[#C9CCDD]",
        disabled: "[&_button]:text-[#C9CCDD] [&_button]:opacity-50 [&_button]:hover:bg-transparent",
        hidden:   "invisible",

        range_start:  "[&_button]:rounded-r-none",
        range_middle: "[&_button]:rounded-none [&_button]:bg-[#EEECFF] [&_button]:text-[#2C2368]",
        range_end:    "[&_button]:rounded-l-none",

        root: "relative",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
