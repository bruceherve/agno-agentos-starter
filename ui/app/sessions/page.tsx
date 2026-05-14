"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClockIcon,
  RobotIcon,
  UsersThreeIcon,
  GitBranchIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDownIcon,
  SparkleIcon,
  ChatCircleIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

interface Session {
  session_id: string
  session_name: string
  session_type: string | null
  agent_id: string | null
  team_id: string | null
  workflow_id: string | null
  user_id: string | null
  total_tokens: number | null
  created_at: string | null
  updated_at: string | null
  session_summary: { summary: string } | null
}

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface SessionDetail extends Session {
  chat_history: ChatMessage[] | null
  metrics: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  } | null
  agent_data: { name: string; model?: { provider: string; id: string } } | null
}

interface PaginatedSessions {
  data: Session[]
  meta: { page: number; limit: number; total_count: number; total_pages: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  )
}

function fmtTokens(n: number | null | undefined): string {
  if (n == null) return "—"
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

const TYPE_CFG: Record<string, {
  label: string
  Icon: React.ElementType
  iconBg: string
  iconRing: string
  iconText: string
  badge: string
}> = {
  agent: {
    label: "Agent",
    Icon: RobotIcon,
    iconBg: "from-amber-500/25 to-amber-500/5",
    iconRing: "ring-amber-500/25",
    iconText: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
  },
  team: {
    label: "Team",
    Icon: UsersThreeIcon,
    iconBg: "from-orange-500/25 to-orange-500/5",
    iconRing: "ring-orange-500/25",
    iconText: "text-orange-400",
    badge: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20",
  },
  workflow: {
    label: "Workflow",
    Icon: GitBranchIcon,
    iconBg: "from-violet-500/25 to-violet-500/5",
    iconRing: "ring-violet-500/25",
    iconText: "text-violet-400",
    badge: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20",
  },
}

function getTypeCfg(type: string | null) {
  return TYPE_CFG[type ?? "agent"] ?? TYPE_CFG.agent
}

// ── Dot loader ────────────────────────────────────────────────────────────────

function Dots({ small = false }: { small?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center", small ? "py-6" : "min-h-[300px]")}>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className={cn("rounded-full bg-white/20", small ? "size-1.5" : "size-2")}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ detail }: { detail: SessionDetail }) {
  const messages = (detail.chat_history ?? []).filter(m => m.role !== "system")
  const mx = detail.metrics

  return (
    <div className="flex flex-col gap-5">
      {/* Metrics */}
      {mx && (mx.total_tokens || mx.input_tokens || mx.output_tokens) && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Total tokens", value: fmtTokens(mx.total_tokens) },
            { label: "Input", value: fmtTokens(mx.input_tokens) },
            { label: "Output", value: fmtTokens(mx.output_tokens) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</p>
              <p className="mt-0.5 text-[16px] font-semibold text-white/80">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {detail.session_summary?.summary && (
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-400/60">
            Summary
          </p>
          <p className="text-[12.5px] leading-relaxed text-white/70">
            {detail.session_summary.summary}
          </p>
        </div>
      )}

      {/* Chat history */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/45">
          Chat history · {messages.length} message{messages.length !== 1 ? "s" : ""}
        </p>
        {messages.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-white/50">No messages in this session.</p>
        ) : (
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.role === "user" && "justify-end")}>
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-amber-500/10 ring-1 ring-white/10">
                    <SparkleIcon weight="duotone" className="size-2.5 text-amber-400" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                    msg.role === "user"
                      ? "rounded-tr-md bg-white/[0.09] text-white/85"
                      : "rounded-tl-md bg-white/[0.04] text-white/75 ring-1 ring-white/[0.07]"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TYPE_FILTERS = ["", "agent", "team", "workflow"] as const

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [listLoading, setListLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Debounce search input → search state
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch sessions list
  useEffect(() => {
    let cancelled = false
    setListLoading(true)

    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sort_by: "updated_at",
      sort_order: "desc",
    })
    if (search) params.set("session_name", search)
    if (typeFilter) params.set("type", typeFilter)

    api.get<PaginatedSessions>(`/sessions?${params}`)
      .then(res => {
        if (cancelled) return
        setSessions(res.data)
        setTotalCount(res.meta.total_count)
        setTotalPages(res.meta.total_pages)
      })
      .catch(() => { if (!cancelled) setSessions([]) })
      .finally(() => { if (!cancelled) setListLoading(false) })

    return () => { cancelled = true }
  }, [page, search, typeFilter])

  async function selectSession(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
      return
    }
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await api.get<SessionDetail>(`/sessions/${id}`)
      setDetail(res)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this session and all its history?")) return
    try {
      await api.delete(`/sessions/${id}`)
      if (selectedId === id) { setSelectedId(null); setDetail(null) }
      // Refetch — trigger by bumping a key; easiest: just re-run the effect
      setSessions(prev => prev.filter(s => s.session_id !== id))
      setTotalCount(c => c - 1)
    } catch { /* ignore */ }
  }

  if (listLoading && sessions.length === 0) return <Dots />

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4">

      {/* ── Header */}
      <div>
        <h1 className="text-[28px] font-medium tracking-tight text-white">Sessions</h1>
        <p className="mt-1 text-[13px] text-white/70">
          {totalCount === 0
            ? "No sessions yet — start a conversation in Chat."
            : `${totalCount} conversation${totalCount !== 1 ? "s" : ""} across all agents`}
        </p>
      </div>

      {/* ── Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-2xl border border-white/[0.18] bg-white/[0.09] px-3.5 py-2.5 transition-colors focus-within:border-white/[0.28] focus-within:bg-white/[0.12]">
          <MagnifyingGlassIcon weight="bold" className="size-3.5 shrink-0 text-white/50" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search sessions…"
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className={cn(
                "rounded-2xl border px-3.5 py-2 text-[12px] font-medium capitalize transition-all duration-150",
                typeFilter === t
                  ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                  : "border-white/[0.15] bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white"
              )}
            >
              {t === "" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── List */}
      {sessions.length === 0 && !listLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <ChatCircleIcon weight="duotone" className="size-7 text-amber-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">No sessions found</p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/50">
              {search || typeFilter
                ? "Try adjusting your filters."
                : "Start a conversation in Chat to create your first session."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {sessions.map((s, i) => {
              const cfg = getTypeCfg(s.session_type)
              const TypeIcon = cfg.Icon
              const isOpen = selectedId === s.session_id
              const componentId = s.agent_id ?? s.team_id ?? s.workflow_id

              return (
                <motion.div
                  key={s.session_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.18) }}
                >
                  {/* Row card */}
                  <button
                    onClick={() => selectSession(s.session_id)}
                    className={cn(
                      "group w-full flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200",
                      isOpen
                        ? "border-amber-500/30 bg-amber-500/[0.08] shadow-[0_0_24px_rgba(245,158,11,0.10)]"
                        : "border-white/[0.09] bg-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.14]"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1",
                      cfg.iconBg, cfg.iconRing
                    )}>
                      <TypeIcon weight="duotone" className={cn("size-5", cfg.iconText)} />
                    </div>

                    {/* Name + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[13.5px] font-semibold text-white">
                          {s.session_name || s.session_id}
                        </p>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                          cfg.badge
                        )}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3">
                        {componentId && (
                          <span className="max-w-[200px] truncate text-[11.5px] text-white/60">
                            {componentId}
                          </span>
                        )}
                        <span className="text-[11.5px] text-white/50">
                          <ClockIcon weight="regular" className="mr-1 inline size-3" />
                          {fmtDate(s.updated_at)}
                        </span>
                      </div>
                      {s.session_summary?.summary && (
                        <p className="mt-1 truncate text-[11.5px] text-white/65">
                          {s.session_summary.summary}
                        </p>
                      )}
                    </div>

                    {/* Right: tokens + delete + caret */}
                    <div className="flex shrink-0 items-center gap-2">
                      {s.total_tokens != null && (
                        <span className="text-[11px] text-white/50">
                          {fmtTokens(s.total_tokens)} tok
                        </span>
                      )}
                      <button
                        onClick={e => handleDelete(s.session_id, e)}
                        className="hidden size-7 items-center justify-center rounded-xl bg-white/[0.06] text-white/50 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:flex"
                      >
                        <TrashIcon weight="bold" className="size-3.5" />
                      </button>
                      <CaretDownIcon
                        weight="bold"
                        className={cn(
                          "size-3.5 transition-all duration-200",
                          isOpen ? "text-amber-400 rotate-180" : "text-white/35 group-hover:text-white/60"
                        )}
                      />
                    </div>
                  </button>

                  {/* Detail panel */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="mt-1.5 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-5">
                          {detailLoading ? (
                            <Dots small />
                          ) : detail ? (
                            <DetailPanel detail={detail} />
                          ) : (
                            <p className="py-6 text-center text-[13px] text-white/60">
                              Could not load session details.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* ── Pagination */}
          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[12px] text-white/50">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex size-8 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-white/50 transition-all hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <CaretLeftIcon weight="bold" className="size-3.5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex size-8 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-white/50 transition-all hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <CaretRightIcon weight="bold" className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
