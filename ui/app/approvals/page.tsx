"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  HandshakeIcon,
  CheckCircleIcon,
  XCircleIcon,
  RobotIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  WrenchIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Approval {
  id: string
  status: "pending" | "approved" | "rejected"
  tool_name?: string
  tool_args?: Record<string, unknown>
  agent_id?: string
  session_id?: string
  run_id?: string
  created_at?: string
  resolved_at?: string
  reason?: string
}

type StatusFilter = "pending" | "all" | "approved" | "rejected"

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === "pending")  return { label: "Pending",  cls: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20" }
  if (status === "approved") return { label: "Approved", cls: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20" }
  if (status === "rejected") return { label: "Rejected", cls: "bg-red-500/15 text-red-400 ring-1 ring-red-500/20" }
  return { label: status, cls: "bg-white/[0.06] text-white/50" }
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

// ── Approval row ──────────────────────────────────────────────────────────────

function ApprovalRow({
  approval,
  isOpen,
  onToggle,
  onResolved,
}: {
  approval: Approval
  isOpen: boolean
  onToggle: () => void
  onResolved: (id: string, status: "approved" | "rejected") => void
}) {
  const badge = statusBadge(approval.status)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [resolving, setResolving] = useState(false)

  async function resolve(approve: boolean) {
    setResolving(true)
    try {
      await api.post(`/approvals/${approval.id}/resolve`, {
        approve,
        ...(reason ? { reason } : {}),
      })
      onResolved(approval.id, approve ? "approved" : "rejected")
      setRejecting(false)
      setReason("")
    } catch {
      // keep buttons active on error
    } finally {
      setResolving(false)
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
            ? "border-rose-500/30 bg-rose-500/[0.07] shadow-[0_0_24px_rgba(244,63,94,0.08)]"
            : "border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14]"
        )}
      >
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/25 to-rose-500/5 ring-1 ring-rose-500/25">
          <WrenchIcon weight="duotone" className="size-5 text-rose-400" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13.5px] font-semibold text-white">
              {approval.tool_name ?? "Unknown Tool"}
            </p>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium", badge.cls)}>
              {badge.label}
            </span>
          </div>
          {approval.agent_id && (
            <div className="mt-0.5 flex items-center gap-1">
              <RobotIcon weight="duotone" className="size-3 text-white/40" />
              <span className="font-mono text-[11px] text-white/50">{approval.agent_id}</span>
            </div>
          )}
          {approval.created_at && (
            <p className="mt-0.5 text-[11px] text-white/40">{formatDate(approval.created_at)}</p>
          )}
        </div>

        {/* Caret */}
        <CaretDownIcon
          weight="bold"
          className={cn(
            "size-3.5 shrink-0 transition-all duration-200",
            isOpen ? "rotate-180 text-rose-400" : "text-white/35 group-hover:text-white/60"
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

              {/* Tool args */}
              {approval.tool_args && Object.keys(approval.tool_args).length > 0 && (
                <div>
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/45">
                    Tool Arguments
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11.5px] leading-relaxed text-white/75">
                    {JSON.stringify(approval.tool_args, null, 2)}
                  </pre>
                </div>
              )}

              {/* Meta pills */}
              {(approval.session_id || approval.run_id) && (
                <div className="flex flex-wrap gap-2">
                  {approval.session_id && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">Session</span>
                      <span className="font-mono text-[11px] text-white/70">{approval.session_id}</span>
                    </div>
                  )}
                  {approval.run_id && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">Run</span>
                      <span className="font-mono text-[11px] text-white/70">{approval.run_id}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution info */}
              {approval.status !== "pending" && (approval.resolved_at || approval.reason) && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/45">Resolution</p>
                  <div className="flex flex-col gap-1">
                    {approval.resolved_at && (
                      <p className="text-[12px] text-white/60">{formatDate(approval.resolved_at)}</p>
                    )}
                    {approval.reason && (
                      <p className="text-[12.5px] italic text-white/75">"{approval.reason}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Approve / Reject actions */}
              {approval.status === "pending" && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Action</p>

                  <AnimatePresence>
                    {rejecting && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: "hidden" }}
                      >
                        <textarea
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          rows={2}
                          className="mb-3 w-full resize-none rounded-2xl border border-white/[0.12] bg-white/[0.06] px-3.5 py-2.5 text-[12.5px] text-white/85 outline-none placeholder:text-white/30 focus:border-white/[0.20]"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => resolve(true)}
                      disabled={resolving}
                      className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2 text-[12.5px] font-semibold text-emerald-300 ring-1 ring-emerald-500/25 transition-all hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      <CheckCircleIcon weight="duotone" className="size-4" />
                      Approve
                    </button>

                    {!rejecting ? (
                      <button
                        onClick={() => setRejecting(true)}
                        disabled={resolving}
                        className="flex items-center gap-2 rounded-2xl bg-red-500/10 px-4 py-2 text-[12.5px] font-semibold text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <XCircleIcon weight="duotone" className="size-4" />
                        Reject
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => resolve(false)}
                          disabled={resolving}
                          className="flex items-center gap-2 rounded-2xl bg-red-500/15 px-4 py-2 text-[12.5px] font-semibold text-red-400 ring-1 ring-red-500/25 transition-all hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <XCircleIcon weight="duotone" className="size-4" />
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejecting(false); setReason("") }}
                          className="rounded-2xl border border-white/[0.09] px-3 py-2 text-[12px] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Pending",  value: "pending" },
  { label: "All",      value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<StatusFilter>("pending")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchApprovals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get<unknown>("/approvals")
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.approvals)
          ? (res as Record<string, unknown>).approvals as Approval[]
          : []
      setApprovals(list)
    } catch {
      setApprovals([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  function onResolved(id: string, status: "approved" | "rejected") {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const pendingCount = approvals.filter(a => a.status === "pending").length
  const filtered = filter === "all" ? approvals : approvals.filter(a => a.status === filter)

  if (loading) return <Dots />

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">

      {/* ── Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight text-white">Approvals</h1>
          <p className="mt-1 text-[13px] text-white/70">
            {pendingCount === 0
              ? "No pending approvals."
              : `${pendingCount} approval${pendingCount !== 1 ? "s" : ""} awaiting action`}
          </p>
        </div>
        <button
          onClick={() => fetchApprovals(true)}
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
                ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25"
                : "bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80"
            )}
          >
            {label}
            {value === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-500/25 px-1.5 py-0.5 text-[10px] text-rose-300">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20">
            <HandshakeIcon weight="duotone" className="size-7 text-rose-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">
              {filter === "pending" ? "No pending approvals" : `No ${filter} approvals`}
            </p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/50">
              {filter === "pending"
                ? "Agents will request approval here when they need human confirmation."
                : "Nothing matches this filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {filtered.map((approval, i) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.04, 0.2) }}
              >
                <ApprovalRow
                  approval={approval}
                  isOpen={selectedId === approval.id}
                  onToggle={() => setSelectedId(prev => prev === approval.id ? null : approval.id)}
                  onResolved={onResolved}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
