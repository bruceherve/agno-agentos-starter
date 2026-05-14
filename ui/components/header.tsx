"use client"

import { SidebarSimpleIcon } from "@phosphor-icons/react"
import { useSidebar } from "@/components/ui/sidebar"

export function Header() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex items-center h-[62px] shrink-0 border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur-xl">
      <button
        onClick={toggleSidebar}
        className="flex size-7 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/80"
      >
        <SidebarSimpleIcon weight="regular" className="size-4" />
      </button>
    </header>
  )
}