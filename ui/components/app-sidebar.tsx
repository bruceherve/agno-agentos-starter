"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HouseIcon,
  ChatsCircleIcon,
  UsersThreeIcon,
  BookOpenIcon,
  BrainIcon,
  FlaskIcon,
  ClockCounterClockwiseIcon,
  ChartBarIcon,
  TreeStructureIcon,
  HandshakeIcon,
  CalendarIcon,
  PulseIcon,
  GearIcon,
  ArrowSquareOutIcon,
  CpuIcon,
  UserCircleIcon,
} from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Home",       href: "/",           icon: HouseIcon,                color: "from-violet-500/25 to-violet-500/5", ring: "ring-violet-500/25", iconColor: "text-violet-400" },
  { label: "Chat",       href: "/chat",        icon: ChatsCircleIcon,          color: "from-indigo-500/25 to-indigo-500/5", ring: "ring-indigo-500/25", iconColor: "text-indigo-400" },
  { label: "Teams",      href: "/teams",       icon: UsersThreeIcon,           color: "from-orange-500/25 to-orange-500/5", ring: "ring-orange-500/25", iconColor: "text-orange-400" },
  { label: "Knowledge",  href: "/knowledge",   icon: BookOpenIcon,             color: "from-blue-500/25 to-blue-500/5",    ring: "ring-blue-500/25",   iconColor: "text-blue-400"   },
  { label: "Memory",     href: "/memory",      icon: BrainIcon,                color: "from-pink-500/25 to-pink-500/5",    ring: "ring-pink-500/25",   iconColor: "text-pink-400"   },
  { label: "Evaluation", href: "/evaluation",  icon: FlaskIcon,                color: "from-emerald-500/25 to-emerald-500/5", ring: "ring-emerald-500/25", iconColor: "text-emerald-400" },
  { label: "Sessions",   href: "/sessions",    icon: ClockCounterClockwiseIcon, color: "from-amber-500/25 to-amber-500/5", ring: "ring-amber-500/25",  iconColor: "text-amber-400"  },
  { label: "Metrics",    href: "/metrics",     icon: ChartBarIcon,             color: "from-cyan-500/25 to-cyan-500/5",    ring: "ring-cyan-500/25",   iconColor: "text-cyan-400"   },
  { label: "Workflows",  href: "/workflows",   icon: TreeStructureIcon,        color: "from-teal-500/25 to-teal-500/5",    ring: "ring-teal-500/25",   iconColor: "text-teal-400"   },
  { label: "Approvals",  href: "/approvals",   icon: HandshakeIcon,            color: "from-rose-500/25 to-rose-500/5",    ring: "ring-rose-500/25",   iconColor: "text-rose-400"   },
  { label: "Schedules",  href: "/schedules",   icon: CalendarIcon,             color: "from-sky-500/25 to-sky-500/5",      ring: "ring-sky-500/25",    iconColor: "text-sky-400"    },
  { label: "Traces",     href: "/traces",      icon: PulseIcon,                color: "from-purple-500/25 to-purple-500/5", ring: "ring-purple-500/25", iconColor: "text-purple-400" },
]

const bottomItems = [
  { label: "Settings", href: "/settings", icon: GearIcon, color: "from-slate-500/25 to-slate-500/5", ring: "ring-slate-500/25", iconColor: "text-slate-400" },
]

const externalLinks = [
  { label: "Docs",   href: "https://github.com/bruceherve/agno-agentos-starter#readme" },
  { label: "GitHub", href: "https://github.com/bruceherve/agno-agentos-starter" },
]

function Divider() {
  return <div className="h-px w-full bg-white/[0.06]" />
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader className="px-3 h-[62px] flex justify-center flex-col">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
            <CpuIcon weight="duotone" className="size-4 text-primary" />
          </div>
          <span className="truncate text-[13px] font-bold tracking-tight text-sidebar-accent-foreground">
            Agent Platform
          </span>
        </div>
      </SidebarHeader>

      <Divider />

      {/* Main nav */}
      <SidebarContent className="px-2 pt-4 pb-0 flex-1">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map(({ label, href, icon: Icon, color, ring, iconColor }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href))
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      tooltip={label}
                      className="h-10 gap-3 rounded-xl px-2 text-[13px] font-medium tracking-[-0.01em] transition-all duration-150
                        text-sidebar-foreground/90
                        hover:bg-white/[0.06] hover:text-white
                        data-[active=true]:bg-white/[0.07] data-[active=true]:text-white data-[active=true]:ring-1 data-[active=true]:ring-white/[0.08]"
                    >
                      <div className={`flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} ring-1 ${ring}`}>
                        <Icon weight="duotone" className={`size-[14px] ${iconColor}`} />
                      </div>
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom section */}
      <div className="px-2 pb-1 mt-auto">
        <Divider />
        <div className="pt-2">
          <SidebarMenu className="gap-1.5">
            {bottomItems.map(({ label, href, icon: Icon, color, ring, iconColor }) => {
              const active = pathname === href
              return (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={active}
                    tooltip={label}
                    className="h-9 gap-3 rounded-xl px-2 text-[13px] font-medium text-sidebar-foreground/80 transition-all duration-150 hover:bg-white/[0.06] hover:text-white data-[active=true]:bg-white/[0.07] data-[active=true]:text-white"
                  >
                    <div className={`flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} ring-1 ${ring}`}>
                      <Icon weight="duotone" className={`size-[14px] ${iconColor}`} />
                    </div>
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </div>

        <Divider />

        {/* External links */}
        <div className="pt-2 pb-1">
          <SidebarMenu className="gap-px">
            {externalLinks.map(({ label, href }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<a href={href} target="_blank" rel="noreferrer" />}
                  tooltip={label}
                  className="h-7 gap-2.5 rounded-lg px-3 text-[11.5px] font-medium text-sidebar-foreground/80 transition-all duration-150 hover:bg-white/[0.05] hover:text-white"
                >
                  <ArrowSquareOutIcon weight="regular" className="size-3 shrink-0" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <Divider />

        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30">
            <UserCircleIcon weight="duotone" className="size-4 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-[11.5px] font-semibold text-sidebar-foreground/90">User</span>
            <span className="truncate text-[10px] text-sidebar-foreground/50">starter-agent</span>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}