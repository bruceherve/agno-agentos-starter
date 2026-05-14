"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarIcon,
  RobotIcon,
  TreeStructureIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  PlayIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Schedule {
  id: string
  name?: string
  schedule?: string
  is_enabled?: boolean
  enabled?: boolean
  agent_id?: string
  workflow_id?: string
  last_run_at?: string
  next_run_at?: string
  created_at?: string
  metadata?: Record<string, unknown>
}

type EnabledFilter = "all" | "enabled" | "disabled"

// ── Helpers ───────────────────────────────────────────────────────────────────

function isEnabled(s: Schedule) {
  return s.is_enabled ?? s.enabled ?? false
}

function formatDate(str?: string) {
  if (!str) return null
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(str))
  } catch { return str }
}

// ── Dot loader ────────────────────────────────────────────────────────────────

function Dots() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-white/20"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Schedule row ──────────────────────────────────────────────────────────────

function ScheduleRow({
  schedule,
  isOpen,
  onToggle,
  onUpdated,
}: {
  schedule: Schedule
  isOpen: boolean
  onToggle: () => void
  onUpdated: (id: string, patch: Partial<Schedule>) => void
}) {
  const enabled = isEnabled(schedule)
  const [toggling, setToggling]   = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [triggered, setTriggered]   = useState(false)

  async function toggleEnabled() {
    setToggling(true)
    try {
      await api.post(`/schedules/${schedule.id}/${enabled ? "disable" : "enable"}`, {})
      onUpdated(schedule.id, { is_enabled: !enabled, enabled: !enabled })
    } catch {
      // keep state on error
    } finally {
      setToggling(false)
    }
  }

  async function triggerNow() {
    setTriggering(true)
    try {
      await api.post(`/schedules/${schedule.id}/trigger`, {})
      setTriggered(true)
      setTimeout(() => setTriggered(false), 3000)
    } catch {
      // silent
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div>
      {/* Row card */}
      <button
        onClick={onToggle}
        className={cn(
          "group w-full flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200",
          isOpen
            ? "border-sky-500/30 bg-sky-500/[0.07] shadow-[0_0_24px_rgba(14,165,233,0.08)]"
            : "border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14]"
        )}
      >
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/25 to-sky-500/5 ring-1 ring-sky-500/25">
          <CalendarIcon weight="duotone" className="size-5 text-sky-400" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13.5px] font-semibold text-white">
              {schedule.name ?? schedule.id}
            </p>
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium",
              enabled
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20"
                : "bg-white/[0.06] text-white/45 ring-1 ring-white/[0.08]"
            )}>
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          {schedule.schedule && (
            <p className="mt-0.5 font-mono text-[11.5px] text-sky-300/70">{schedule.schedule}</p>
          )}
          {(schedule.agent_id || schedule.workflow_id) && (
            <div className="mt-0.5 flex items-center gap-1">
              {schedule.agent_id
                ? <RobotIcon weight="duotone" className="size-3 text-white/40" />
                : <TreeStructureIcon weight="duotone" className="size-3 text-white/40" />
              }
              <span className="font-mono text-[11px] text-white/50">
                {schedule.agent_id ?? schedule.workflow_id}
              </span>
            </div>
          )}
        </div>

        {/* Caret */}
        <CaretDownIcon
          weight="bold"
          className={cn(
            "size-3.5 shrink-0 transition-all duration-200",
            isOpen ? "rotate-180 text-sky-400" : "text-white/35 group-hover:text-white/60"
          )}
        />
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
            <div className="mt-1.5 flex flex-col gap-5 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-5">

              {/* Timing info */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {schedule.schedule && (
                  <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Cron</span>
                    <span className="font-mono text-[12px] text-sky-300/80">{schedule.schedule}</span>
                  </div>
                )}
                {schedule.last_run_at && (
                  <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Last Run</span>
                    <span className="text-[11.5px] text-white/70">{formatDate(schedule.last_run_at)}</span>
                  </div>
                )}
                {schedule.next_run_at && (
                  <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Next Run</span>
                    <span className="text-[11.5px] text-white/70">{formatDate(schedule.next_run_at)}</span>
                  </div>
                )}
                {schedule.created_at && (
                  <div className="flex flex-col gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Created</span>
                    <span className="text-[11.5px] text-white/70">{formatDate(schedule.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {schedule.metadata && Object.keys(schedule.metadata).length > 0 && (
                <div>
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/45">Metadata</p>
                  <pre className="overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11.5px] leading-relaxed text-white/75">
                    {JSON.stringify(schedule.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {/* Trigger now */}
                  <button
                    onClick={triggerNow}
                    disabled={triggering || triggered}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl px-4 py-2 text-[12.5px] font-semibold ring-1 transition-all disabled:opacity-60",
                      triggered
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                        : "bg-sky-500/15 text-sky-300 ring-sky-500/25 hover:bg-sky-500/25"
                    )}
                  >
                    <PlayIcon weight="duotone" className="size-4" />
                    {triggered ? "Triggered!" : triggering ? "Triggering…" : "Trigger Now"}
                  </button>

                  {/* Enable / Disable toggle */}
                  <button
                    onClick={toggleEnabled}
                    disabled={toggling}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl px-4 py-2 text-[12.5px] font-semibold ring-1 transition-all disabled:opacity-60",
                      enabled
                        ? "bg-white/[0.05] text-white/60 ring-white/[0.10] hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/20"
                        : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                  >
                    {enabled
                      ? <ToggleRightIcon weight="duotone" className="size-4" />
                      : <ToggleLeftIcon  weight="duotone" className="size-4" />
                    }
                    {toggling ? "Updating…" : enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: EnabledFilter }[] = [
  { label: "All",      value: "all" },
  { label: "Enabled",  value: "enabled" },
  { label: "Disabled", value: "disabled" },
]

export default function SchedulesPage() {
  const [schedules, setSchedules]   = useState<Schedule[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<EnabledFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSchedules = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get<unknown>("/schedules")
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.schedules)
          ? (res as Record<string, unknown>).schedules as Schedule[]
          : []
      setSchedules(list)
    } catch {
      setSchedules([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  function onUpdated(id: string, patch: Partial<Schedule>) {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const filtered = filter === "all"
    ? schedules
    : schedules.filter(s => filter === "enabled" ? isEnabled(s) : !isEnabled(s))

  const enabledCount = schedules.filter(isEnabled).length

  if (loading) return <Dots />

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">

      {/* ── Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight text-white">Schedules</h1>
          <p className="mt-1 text-[13px] text-white/70">
            {schedules.length === 0
              ? "No schedules registered yet."
              : `${enabledCount} of ${schedules.length} schedule${schedules.length !== 1 ? "s" : ""} enabled`}
          </p>
        </div>
        <button
          onClick={() => fetchSchedules(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-[12.5px] font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <ArrowsClockwiseIcon weight="bold" className={cn("size-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Filter tabs */}
      <div className="flex gap-1.5">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-all",
              filter === value
                ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25"
                : "bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── List or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-500/20">
            <CalendarIcon weight="duotone" className="size-7 text-sky-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">
              {filter === "all" ? "No schedules found" : `No ${filter} schedules`}
            </p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/50">
              {filter === "all"
                ? "Register a schedule in your backend to see it here."
                : "Nothing matches this filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {filtered.map((schedule, i) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.04, 0.2) }}
              >
                <ScheduleRow
                  schedule={schedule}
                  isOpen={selectedId === schedule.id}
                  onToggle={() => setSelectedId(prev => prev === schedule.id ? null : schedule.id)}
                  onUpdated={onUpdated}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
