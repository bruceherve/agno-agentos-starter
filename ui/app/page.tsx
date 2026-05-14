import Link from "next/link"
import {
  ChatsCircleIcon,
  BookOpenIcon,
  BrainIcon,
  FlaskIcon,
  ClockCounterClockwiseIcon,
  ChartBarIcon,
} from "@phosphor-icons/react/dist/ssr"

const cards = [
  {
    label: "Chat",
    description: "Talk to your agents in real time",
    href: "/chat",
    icon: ChatsCircleIcon,
    color: "from-violet-500/20 to-violet-500/5",
    ring: "ring-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    label: "Knowledge",
    description: "Manage your agent knowledge bases",
    href: "/knowledge",
    icon: BookOpenIcon,
    color: "from-blue-500/20 to-blue-500/5",
    ring: "ring-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    label: "Memory",
    description: "Browse and edit agent memories",
    href: "/memory",
    icon: BrainIcon,
    color: "from-pink-500/20 to-pink-500/5",
    ring: "ring-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    label: "Evaluation",
    description: "Run and review agent evaluations",
    href: "/evaluation",
    icon: FlaskIcon,
    color: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    label: "Sessions",
    description: "View all past agent sessions",
    href: "/sessions",
    icon: ClockCounterClockwiseIcon,
    color: "from-amber-500/20 to-amber-500/5",
    ring: "ring-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    label: "Metrics",
    description: "Track runs, sessions, and token usage",
    href: "/metrics",
    icon: ChartBarIcon,
    color: "from-cyan-500/20 to-cyan-500/5",
    ring: "ring-cyan-500/20",
    iconColor: "text-cyan-400",
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-medium tracking-tight text-white">
          What do you want to work on today?
        </h1>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map(({ label, description, href, icon: Icon, color, ring, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col gap-5 rounded-3xl border border-white/[0.09] bg-white/[0.05] p-6 transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} ring-1 ${ring}`}>
              <Icon weight="duotone" className={`size-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-[14.5px] font-bold text-white tracking-tight">
                {label}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/85">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}