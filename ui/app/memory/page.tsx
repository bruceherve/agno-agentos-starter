"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BrainIcon,
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  SparkleIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Memory {
  id: string
  memory: string
  user_id?: string
  topic?: string
  topics?: string[]
  created_at?: string
  updated_at?: string
}

interface MemoriesResponse {
  memories?: Memory[]
  total?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str?: string) {
  if (!str) return null
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(str))
  } catch { return str }
}

function getTopics(m: Memory): string[] {
  if (m.topics && m.topics.length > 0) return m.topics
  if (m.topic) return [m.topic]
  return []
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

// ── Memory card ───────────────────────────────────────────────────────────────

function MemoryCard({ memory }: { memory: Memory }) {
  const topics = getTopics(memory)

  return (
    <div className="flex flex-col gap-2.5 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
      <p className="text-[13px] leading-relaxed text-white/85">{memory.memory}</p>
      <div className="flex flex-wrap items-center gap-2">
        {topics.map(t => (
          <span
            key={t}
            className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10.5px] text-pink-300 ring-1 ring-pink-500/20"
          >
            {t}
          </span>
        ))}
        {memory.user_id && (
          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <UserCircleIcon weight="duotone" className="size-3" />
            {memory.user_id}
          </span>
        )}
        {(memory.updated_at ?? memory.created_at) && (
          <span className="ml-auto text-[11px] text-white/35">
            {formatDate(memory.updated_at ?? memory.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function MemoryPage() {
  const [memories, setMemories]     = useState<Memory[]>([])
  const [topics, setTopics]         = useState<string[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimized, setOptimized]   = useState(false)
  const [search, setSearch]         = useState("")
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [page, setPage]             = useState(1)

  const fetchTopics = useCallback(async () => {
    try {
      const res = await api.get<unknown>("/memory_topics")
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.topics)
          ? (res as Record<string, unknown>).topics as string[]
          : []
      setTopics(list as string[])
    } catch { /* non-critical */ }
  }, [])

  const fetchMemories = useCallback(async (opts: {
    page?: number; search?: string; topic?: string | null; isRefresh?: boolean
  } = {}) => {
    const { page: p = 1, search: s = "", topic: t = null, isRefresh = false } = opts
    if (isRefresh) setRefreshing(true)
    else if (p === 1 && !isRefresh) setLoading(true)

    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) })
    if (s) params.set("search", s)
    if (t) params.set("topic", t)

    try {
      const res = await api.get<unknown>(`/memories?${params}`)
      const list: Memory[] = Array.isArray(res)
        ? res as Memory[]
        : ((res as MemoriesResponse).memories ?? [])
      const count = Array.isArray(res)
        ? list.length
        : ((res as MemoriesResponse).total ?? list.length)
      setMemories(list)
      setTotal(count)
      setPage(p)
    } catch {
      setMemories([])
      setTotal(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchTopics()
    fetchMemories()
  }, [fetchTopics, fetchMemories])

  function applySearch(s: string) {
    setSearch(s)
    fetchMemories({ search: s, topic: activeTopic, page: 1 })
  }

  function applyTopic(t: string | null) {
    setActiveTopic(t)
    fetchMemories({ search, topic: t, page: 1 })
  }

  async function optimize() {
    setOptimizing(true)
    try {
      await api.post("/optimize-memories", {})
      setOptimized(true)
      setTimeout(() => setOptimized(false), 3000)
      fetchMemories({ search, topic: activeTopic, page: 1, isRefresh: true })
    } catch { /* silent */ }
    finally { setOptimizing(false) }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (loading) return <Dots />

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">

      {/* ── Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight text-white">Memory</h1>
          <p className="mt-1 text-[13px] text-white/70">
            {total === 0
              ? "No memories stored yet."
              : `${total} memor${total !== 1 ? "ies" : "y"} stored`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMemories({ search, topic: activeTopic, page, isRefresh: true })}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-[12.5px] font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <ArrowsClockwiseIcon weight="bold" className={cn("size-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={optimize}
            disabled={optimizing || optimized}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-2 text-[12.5px] font-semibold ring-1 transition-all disabled:opacity-60",
              optimized
                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                : "bg-pink-500/15 text-pink-300 ring-pink-500/25 hover:bg-pink-500/25"
            )}
          >
            <SparkleIcon weight="duotone" className="size-4" />
            {optimized ? "Optimized!" : optimizing ? "Optimizing…" : "Optimize"}
          </button>
        </div>
      </div>

      {/* ── Search */}
      <div className="relative">
        <MagnifyingGlassIcon weight="bold" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => applySearch(e.target.value)}
          placeholder="Search memories…"
          className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.06] py-2.5 pl-10 pr-10 text-[13px] text-white/85 outline-none placeholder:text-white/30 focus:border-white/[0.22] transition-colors"
        />
        {search && (
          <button
            onClick={() => applySearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <XIcon weight="bold" className="size-3.5" />
          </button>
        )}
      </div>

      {/* ── Topic pills */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => applyTopic(null)}
            className={cn(
              "rounded-xl px-3 py-1 text-[11.5px] font-medium transition-all",
              activeTopic === null
                ? "bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/25"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/75"
            )}
          >
            All
          </button>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => applyTopic(t === activeTopic ? null : t)}
              className={cn(
                "rounded-xl px-3 py-1 text-[11.5px] font-medium transition-all",
                activeTopic === t
                  ? "bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/25"
                  : "bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/75"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* ── List or empty */}
      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-pink-500/10 ring-1 ring-pink-500/20">
            <BrainIcon weight="duotone" className="size-7 text-pink-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">No memories found</p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/50">
              {search || activeTopic
                ? "Try a different search or topic."
                : "Chat with the agent to generate memories."}
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${search}-${activeTopic}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-2"
          >
            {memories.map(m => <MemoryCard key={m.id} memory={m} />)}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchMemories({ search, topic: activeTopic, page: page - 1 })}
            disabled={page <= 1}
            className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-1.5 text-[12px] text-white/60 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-[12px] text-white/45">{page} / {totalPages}</span>
          <button
            onClick={() => fetchMemories({ search, topic: activeTopic, page: page + 1 })}
            disabled={page >= totalPages}
            className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-1.5 text-[12px] text-white/60 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
