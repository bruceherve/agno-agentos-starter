"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PulseIcon,
  CaretDownIcon,
  ArrowsClockwiseIcon,
  RobotIcon,
  ClockIcon,
  WarningCircleIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TraceSummary {
  trace_id: string
  name?: string
  start_time?: string
  end_time?: string
  duration_ms?: number
  status?: string
  span_count?: number
  agent_id?: string
  session_id?: string
  run_id?: string
}

interface TraceSpan {
  span_id: string
  trace_id?: string
  parent_span_id?: string | null
  name: string
  start_time?: string
  end_time?: string
  duration_ms?: number
  status?: string
  attributes?: Record<string, unknown>
  spans?: TraceSpan[]
}

interface TraceDetail extends TraceSummary {
  spans: TraceSpan[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str?: string) {
  if (!str) return null
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(str))
  } catch { return str }
}

function formatDuration(ms?: number) {
  if (ms == null) return null
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function statusBadge(status?: string) {
  const s = (status ?? "").toUpperCase()
  if (s === "OK" || s === "SUCCESS")  return { label: s || "OK",    cls: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20" }
  if (s === "ERROR" || s === "FAILED") return { label: s || "ERROR", cls: "bg-red-500/15 text-red-400 ring-1 ring-red-500/20" }
  return { label: status ?? "UNSET", cls: "bg-white/[0.06] text-white/50 ring-1 ring-white/[0.08]" }
}

// Build a tree from a flat span list using parent_span_id
function buildSpanTree(spans: TraceSpan[]): TraceSpan[] {
  if (!spans.length) return []
  // If already nested, return as-is
  if (spans.some(s => s.spans && s.spans.length > 0)) return spans

  const map = new Map<string, TraceSpan>()
  const roots: TraceSpan[] = []
  spans.forEach(s => map.set(s.span_id, { ...s, spans: [] }))
  map.forEach(span => {
    if (span.parent_span_id && map.has(span.parent_span_id)) {
      map.get(span.parent_span_id)!.spans!.push(span)
    } else {
      roots.push(span)
    }
  })
  return roots
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

function SmallDots() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-white/20"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Span node (recursive tree) ────────────────────────────────────────────────

function SpanNode({ span, depth = 0 }: { span: TraceSpan; depth?: number }) {
  const [open, setOpen] = useState(depth === 0)
  const badge = statusBadge(span.status)
  const hasChildren = span.spans && span.spans.length > 0
  const hasAttrs = span.attributes && Object.keys(span.attributes).length > 0

  // Pick a few meaningful attributes to surface inline
  const attrs = span.attributes ?? {}
  const model  = attrs["llm.model_name"] ?? attrs["gen_ai.request.model"] ?? null
  const tokens = attrs["llm.token_count.total"] ?? attrs["gen_ai.usage.total_tokens"] ?? null

  return (
    <div className={cn("flex flex-col gap-1", depth > 0 && "ml-4 border-l border-white/[0.07] pl-3.5")}>
      <button
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
      >
        {/* Status dot */}
        <div className={cn(
          "size-1.5 shrink-0 rounded-full",
          badge.label.startsWith("OK") || badge.label.startsWith("SUC") ? "bg-emerald-400" :
          badge.label.startsWith("ERR") || badge.label.startsWith("FAIL") ? "bg-red-400" :
          "bg-white/30"
        )} />

        <span className="flex-1 truncate text-[12.5px] font-medium text-white/85">{span.name}</span>

        {model && (
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300 ring-1 ring-purple-500/20">
            {String(model)}
          </span>
        )}
        {tokens != null && (
          <span className="text-[10.5px] text-white/40">{String(tokens)} tok</span>
        )}
        {span.duration_ms != null && (
          <span className="shrink-0 text-[10.5px] text-white/40">{formatDuration(span.duration_ms)}</span>
        )}
        {(hasChildren || hasAttrs) && (
          <CaretDownIcon
            weight="bold"
            className={cn("size-3 shrink-0 text-white/25 transition-transform duration-150 group-hover:text-white/50", open && "rotate-180")}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Attributes */}
            {hasAttrs && (
              <div className="mb-1.5 ml-6 flex flex-wrap gap-1.5">
                {Object.entries(attrs)
                  .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")
                  .slice(0, 8)
                  .map(([k, v]) => (
                    <span key={k} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] text-white/50">
                      <span className="text-white/30">{k.split(".").pop()}:</span> {String(v)}
                    </span>
                  ))
                }
              </div>
            )}

            {/* Children */}
            {hasChildren && (
              <div className="flex flex-col gap-0.5">
                {span.spans!.map(child => (
                  <SpanNode key={child.span_id} span={child} depth={depth + 1} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ detail }: { detail: TraceDetail }) {
  const tree = buildSpanTree(detail.spans ?? [])
  const badge = statusBadge(detail.status)

  return (
    <div className="flex flex-col gap-5">
      {/* Meta pills */}
      <div className="flex flex-wrap gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium", badge.cls)}>
          {badge.label.startsWith("OK") || badge.label.startsWith("SUC")
            ? <CheckCircleIcon weight="duotone" className="size-3.5" />
            : <WarningCircleIcon weight="duotone" className="size-3.5" />
          }
          {badge.label}
        </span>
        {detail.duration_ms != null && (
          <span className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
            <ClockIcon weight="duotone" className="size-3" />
            {formatDuration(detail.duration_ms)}
          </span>
        )}
        {detail.span_count != null && (
          <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
            {detail.span_count} spans
          </span>
        )}
        {detail.agent_id && (
          <span className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70 font-mono">
            <RobotIcon weight="duotone" className="size-3" />
            {detail.agent_id}
          </span>
        )}
        {detail.start_time && (
          <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
            {formatDate(detail.start_time)}
          </span>
        )}
      </div>

      {/* Span tree */}
      {tree.length > 0 ? (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/45">
            Spans · {detail.spans?.length ?? tree.length}
          </p>
          <div className="flex flex-col gap-0.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-2 py-2">
            {tree.map(span => (
              <SpanNode key={span.span_id} span={span} depth={0} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-white/50">No span data available for this trace.</p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TracesPage() {
  const [traces, setTraces]         = useState<TraceSummary[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail]         = useState<TraceDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTraces = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get<unknown>("/traces")
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.traces)
          ? (res as Record<string, unknown>).traces as TraceSummary[]
          : []
      setTraces(list)
    } catch {
      setTraces([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchTraces() }, [fetchTraces])

  async function selectTrace(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
      return
    }
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await api.get<unknown>(`/traces/${id}`)
      // Normalize: might be the detail object directly or wrapped
      const d = (res as Record<string, unknown>)?.trace ?? res
      setDetail(d as TraceDetail)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) return <Dots />

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">

      {/* ── Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight text-white">Traces</h1>
          <p className="mt-1 text-[13px] text-white/70">
            {traces.length === 0
              ? "No traces recorded yet."
              : `${traces.length} trace${traces.length !== 1 ? "s" : ""} recorded`}
          </p>
        </div>
        <button
          onClick={() => fetchTraces(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-[12.5px] font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <ArrowsClockwiseIcon weight="bold" className={cn("size-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── List or empty state */}
      {traces.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/20">
            <PulseIcon weight="duotone" className="size-7 text-purple-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">No traces found</p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/50">
              Run an agent to generate execution traces. Make sure <span className="font-mono text-white/40">tracing=True</span> is set in your backend.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {traces.map((trace, i) => {
              const badge = statusBadge(trace.status)
              const isOpen = selectedId === trace.trace_id

              return (
                <motion.div
                  key={trace.trace_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.04, 0.2) }}
                >
                  {/* Row card */}
                  <button
                    onClick={() => selectTrace(trace.trace_id)}
                    className={cn(
                      "group w-full flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200",
                      isOpen
                        ? "border-purple-500/30 bg-purple-500/[0.07] shadow-[0_0_24px_rgba(168,85,247,0.08)]"
                        : "border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14]"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/25 to-purple-500/5 ring-1 ring-purple-500/25">
                      <PulseIcon weight="duotone" className="size-5 text-purple-400" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[13.5px] font-semibold text-white">
                          {trace.name ?? trace.trace_id}
                        </p>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium", badge.cls)}>
                          {badge.label}
                        </span>
                        {trace.span_count != null && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">
                            {trace.span_count} spans
                          </span>
                        )}
                      </div>
                      {trace.agent_id && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <RobotIcon weight="duotone" className="size-3 text-white/40" />
                          <span className="font-mono text-[11px] text-white/50">{trace.agent_id}</span>
                        </div>
                      )}
                      {trace.start_time && (
                        <p className="mt-0.5 text-[11px] text-white/40">{formatDate(trace.start_time)}</p>
                      )}
                    </div>

                    {/* Duration + caret */}
                    <div className="flex shrink-0 items-center gap-2">
                      {trace.duration_ms != null && (
                        <span className="text-[11px] text-white/50">{formatDuration(trace.duration_ms)}</span>
                      )}
                      <CaretDownIcon
                        weight="bold"
                        className={cn(
                          "size-3.5 transition-all duration-200",
                          isOpen ? "rotate-180 text-purple-400" : "text-white/35 group-hover:text-white/60"
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
                            <SmallDots />
                          ) : detail ? (
                            <DetailPanel detail={detail} />
                          ) : (
                            <p className="py-6 text-center text-[13px] text-white/60">
                              Could not load trace details.
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
        </div>
      )}
    </div>
  )
}
