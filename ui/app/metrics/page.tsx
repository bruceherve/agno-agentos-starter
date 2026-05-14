"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  RocketLaunchIcon,
  ChatCircleIcon,
  LightningIcon,
  UsersThreeIcon,
  ArrowsClockwiseIcon,
  ChartBarIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TokenMetrics {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  cached_tokens?: number
  cache_write_tokens?: number
  reasoning_tokens?: number
}

interface DayMetrics {
  id: string
  date: string
  agent_runs_count: number
  agent_sessions_count: number
  team_runs_count: number
  team_sessions_count: number
  workflow_runs_count: number
  workflow_sessions_count: number
  users_count: number
  token_metrics: TokenMetrics
  model_metrics: { model_id: string; model_provider: string; count: number }[]
}

interface MetricsResponse {
  metrics: DayMetrics[]
  updated_at: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n?: number): string {
  if (!n) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function fmtUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function startDateFor(days: number): string | null {
  if (days === 0) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
] as const

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [range, setRange] = useState<typeof RANGES[number]>(RANGES[1]) // 30d default

  function buildUrl(days: number) {
    const start = startDateFor(days)
    const qs = start ? `?starting_date=${start}` : ""
    return `/metrics${qs}`
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get<MetricsResponse>(buildUrl(range.days))
      .then(res => { if (!cancelled) setData(res) })
      .catch(() => { if (!cancelled) setData({ metrics: [], updated_at: null }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [range])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await api.post("/metrics/refresh", {})
      const res = await api.get<MetricsResponse>(buildUrl(range.days))
      setData(res)
    } catch { /* ignore */ } finally {
      setRefreshing(false)
    }
  }

  const metrics = data?.metrics ?? []

  const totals = useMemo(() => metrics.reduce(
    (acc, m) => ({
      runs: acc.runs + m.agent_runs_count + m.team_runs_count + m.workflow_runs_count,
      sessions: acc.sessions + m.agent_sessions_count + m.team_sessions_count + m.workflow_sessions_count,
      tokens: acc.tokens + (m.token_metrics?.total_tokens ?? 0),
    }),
    { runs: 0, sessions: 0, tokens: 0 }
  ), [metrics])

  const maxUsers = useMemo(() =>
    metrics.length ? Math.max(...metrics.map(m => m.users_count)) : 0,
  [metrics])

  const tokenTotals = useMemo(() => metrics.reduce(
    (acc, m) => ({
      input: acc.input + (m.token_metrics?.input_tokens ?? 0),
      output: acc.output + (m.token_metrics?.output_tokens ?? 0),
      cached: acc.cached + (m.token_metrics?.cached_tokens ?? 0),
      reasoning: acc.reasoning + (m.token_metrics?.reasoning_tokens ?? 0),
    }),
    { input: 0, output: 0, cached: 0, reasoning: 0 }
  ), [metrics])

  const modelTotals = useMemo(() => {
    const map = new Map<string, { count: number; provider: string }>()
    for (const m of metrics) {
      for (const mm of (m.model_metrics ?? [])) {
        const cur = map.get(mm.model_id) ?? { count: 0, provider: mm.model_provider }
        map.set(mm.model_id, { count: cur.count + mm.count, provider: mm.model_provider })
      }
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
  }, [metrics])

  const chartData = useMemo(() =>
    [...metrics]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        date: m.date,
        runs: m.agent_runs_count + m.team_runs_count + m.workflow_runs_count,
      })),
  [metrics])

  const maxRuns = useMemo(() => Math.max(...chartData.map(d => d.runs), 1), [chartData])

  if (loading) return <Dots />

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4">

      {/* ── Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight text-white">Metrics</h1>
          <p className="mt-1 text-[13px] text-white/70">
            {data?.updated_at
              ? `Last updated ${fmtUpdatedAt(data.updated_at)}`
              : "Usage analytics across all agents, teams, and workflows"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/[0.15] bg-white/[0.07] px-4 py-2.5 text-[12.5px] font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-40"
        >
          <ArrowsClockwiseIcon weight="bold" className={cn("size-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Range tabs */}
      <div className="flex gap-1.5">
        {RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-2xl border px-4 py-2 text-[12px] font-medium transition-all duration-150",
              range.label === r.label
                ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-300"
                : "border-white/[0.15] bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {metrics.length === 0 ? (
        /* ── Empty state */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <ChartBarIcon weight="duotone" className="size-7 text-cyan-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">No metrics yet</p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/70">
              Send a few messages in Chat, then hit Refresh to generate metrics.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-1 flex items-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-5 py-2.5 text-[12.5px] font-medium text-cyan-300 transition-all hover:bg-cyan-500/20 disabled:opacity-40"
          >
            <ArrowsClockwiseIcon weight="bold" className={cn("size-3.5", refreshing && "animate-spin")} />
            Generate metrics
          </button>
        </div>
      ) : (
        <>
          {/* ── Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Runs",   value: fmtNum(totals.runs),     Icon: RocketLaunchIcon, color: "text-cyan-400",    bg: "from-cyan-500/25 to-cyan-500/5",    ring: "ring-cyan-500/25"    },
              { label: "Sessions",     value: fmtNum(totals.sessions), Icon: ChatCircleIcon,   color: "text-sky-400",     bg: "from-sky-500/25 to-sky-500/5",      ring: "ring-sky-500/25"      },
              { label: "Tokens Used",  value: fmtNum(totals.tokens),   Icon: LightningIcon,    color: "text-amber-400",   bg: "from-amber-500/25 to-amber-500/5",  ring: "ring-amber-500/25"   },
              { label: "Users",        value: fmtNum(maxUsers),        Icon: UsersThreeIcon,   color: "text-emerald-400", bg: "from-emerald-500/25 to-emerald-500/5", ring: "ring-emerald-500/25" },
            ].map(({ label, value, Icon, color, bg, ring }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex flex-col gap-3 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-5"
              >
                <div className={cn("flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ring-1", bg, ring)}>
                  <Icon weight="duotone" className={cn("size-5", color)} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{label}</p>
                  <p className="mt-1 text-[26px] font-semibold leading-none text-white">{value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Token breakdown */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/65">
              Token Breakdown
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Input",     value: tokenTotals.input     },
                { label: "Output",    value: tokenTotals.output    },
                { label: "Cached",    value: tokenTotals.cached    },
                { label: "Reasoning", value: tokenTotals.reasoning },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 py-3.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-widest text-white/70">{label}</p>
                  <p className="mt-1 text-[20px] font-semibold text-white">{fmtNum(value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Daily runs chart */}
          {chartData.length > 0 && (
            <div className="rounded-3xl border border-white/[0.09] bg-white/[0.03] p-5">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-white/65">
                Daily Runs
              </p>
              <div className="flex h-32 items-end gap-px">
                {chartData.map(d => {
                  const pct = Math.max((d.runs / maxRuns) * 100, d.runs > 0 ? 5 : 1)
                  return (
                    <div key={d.date} className="group relative flex flex-1 flex-col items-center">
                      <div
                        className="w-full min-w-[2px] rounded-t-sm bg-gradient-to-t from-cyan-500/70 to-cyan-400/35 transition-all group-hover:from-cyan-400/90 group-hover:to-cyan-300/60"
                        style={{ height: `${pct}%` }}
                      />
                      {/* hover tooltip */}
                      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.12] bg-white/[0.12] px-2 py-1 text-[10px] font-medium text-white/90 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        {d.runs} run{d.runs !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* X-axis labels */}
              <div className="mt-2 flex items-start gap-px">
                {chartData.map((d, i) => {
                  const step = Math.ceil(chartData.length / 6)
                  const show = chartData.length <= 10 || i === 0 || i === chartData.length - 1 || i % step === 0
                  return (
                    <div key={d.date} className="flex-1 text-center">
                      {show && (
                        <p className="truncate text-[9px] text-white/60">{fmtShortDate(d.date)}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Model usage */}
          {modelTotals.length > 0 && (
            <div className="rounded-3xl border border-white/[0.09] bg-white/[0.03] p-5">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/65">
                Model Usage
              </p>
              <div className="flex flex-col gap-4">
                {modelTotals.map(m => {
                  const pct = (m.count / modelTotals[0].count) * 100
                  return (
                    <div key={m.id} className="flex items-center gap-4">
                      <div className="w-40 shrink-0">
                        <p className="truncate text-[13px] font-medium text-white">{m.id}</p>
                        <p className="text-[11px] text-white/70">{m.provider}</p>
                      </div>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-cyan-400/50"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[12.5px] font-medium text-white/85">
                        {m.count.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
