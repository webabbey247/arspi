"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {

  return (
     <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      size="lg"
      className="bg-transparent py-2 data-[state=open]:bg-transparent data-[state=open]:text-slate-300"
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg font-body text-[0.6875rem] font-medium">CN</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left">
        {/* Name — DM Sans, 14px, 0em, font-medium */}
        <span className="truncate font-body text-[0.875rem] tracking-[0em] font-medium leading-[1.5]">
          {user.name}
        </span>
        {/* Email — DM Sans, 12px, 0em, font-normal */}
        <span className="truncate font-body text-[0.75rem] tracking-[0em] font-normal leading-[1.5]">
          {user.email}
        </span>
      </div>
      <ChevronsUpDown className="ml-auto size-4" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
    side="bottom"
    align="end"
    sideOffset={4}
  >
    <DropdownMenuLabel className="p-0 font-normal">
      <div className="flex items-center gap-2 px-1 py-1.5 text-left">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="rounded-lg font-body text-[0.6875rem] font-medium">CN</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left">
          <span className="truncate font-body text-[0.875rem] tracking-[0em] font-medium leading-[1.5]">
            {user.name}
          </span>
          <span className="truncate font-body text-[0.75rem] tracking-[0em] font-normal leading-[1.5]">
            {user.email}
          </span>
        </div>
      </div>
    </DropdownMenuLabel>

    <DropdownMenuSeparator />

    <DropdownMenuGroup>
      {/* Menu items — DM Sans, 14px, 0em, font-normal */}
      <DropdownMenuItem className="font-body text-[0.875rem] tracking-[0em] font-normal">
        <Sparkles />
        Upgrade to Pro
      </DropdownMenuItem>
    </DropdownMenuGroup>

    <DropdownMenuSeparator />

    <DropdownMenuGroup>
      <DropdownMenuItem className="font-body text-[0.875rem] tracking-[0em] font-normal">
        <BadgeCheck />
        Account
      </DropdownMenuItem>
      <DropdownMenuItem className="font-body text-[0.875rem] tracking-[0em] font-normal">
        <CreditCard />
        Billing
      </DropdownMenuItem>
      <DropdownMenuItem className="font-body text-[0.875rem] tracking-[0em] font-normal">
        <Bell />
        Notifications
      </DropdownMenuItem>
    </DropdownMenuGroup>

    <DropdownMenuSeparator />

    <DropdownMenuItem className="font-body text-[0.875rem] tracking-[0em] font-normal">
      <LogOut />
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
  )
}
