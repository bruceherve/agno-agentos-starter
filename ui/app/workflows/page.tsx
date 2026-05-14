"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TreeStructureIcon,
  RobotIcon,
  UsersThreeIcon,
  CaretDownIcon,
  ArrowRightIcon,
  FactoryIcon,
  SquaresFourIcon,
  CodeIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkflowSummary {
  id: string
  name: string | null
  description: string | null
  db_id: string | null
  is_factory: boolean
  is_component: boolean
  current_version: number | null
  stage: string | null
}

interface WorkflowStep {
  name?: string
  type?: string
  agent?: { name?: string; agent_id?: string }
  team?: { name?: string; team_id?: string }
  steps?: WorkflowStep[]
  [key: string]: unknown
}

interface WorkflowDetail extends WorkflowSummary {
  input_schema: Record<string, unknown> | null
  steps: WorkflowStep[] | null
  metadata: Record<string, unknown> | null
  workflow_agent: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeBadge(w: WorkflowSummary) {
  if (w.is_factory) return { label: "Factory",   cls: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20" }
  if (w.is_component) return { label: "Component", cls: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20" }
  return { label: "Workflow",  cls: "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/20" }
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

// ── Step tree ─────────────────────────────────────────────────────────────────

function StepNode({ step, index, depth = 0 }: { step: WorkflowStep; index: number; depth?: number }) {
  const name = step.name ?? `Step ${index + 1}`
  const agentName = step.agent?.name
  const teamName = step.team?.name

  return (
    <div className={cn("flex flex-col gap-1.5", depth > 0 && "ml-5 border-l border-white/[0.08] pl-4")}>
      <div className="flex items-center gap-2.5">
        {/* connector dot */}
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 ring-1 ring-teal-500/25 text-[9px] font-bold text-teal-400">
          {index + 1}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-white/90">{name}</span>
          {agentName && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] text-amber-300 ring-1 ring-amber-500/20">
              <RobotIcon weight="duotone" className="size-3" />{agentName}
            </span>
          )}
          {teamName && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10.5px] text-orange-300 ring-1 ring-orange-500/20">
              <UsersThreeIcon weight="duotone" className="size-3" />{teamName}
            </span>
          )}
          {step.type && (
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">
              {String(step.type)}
            </span>
          )}
        </div>
      </div>
      {/* Nested steps */}
      {step.steps && step.steps.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {step.steps.map((sub, i) => (
            <StepNode key={i} step={sub} index={i} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Input schema display ──────────────────────────────────────────────────────

function InputSchema({ schema }: { schema: Record<string, unknown> }) {
  const props = (schema.properties ?? {}) as Record<string, { type?: string; default?: unknown; description?: string }>
  const required = (schema.required ?? []) as string[]
  const entries = Object.entries(props)

  if (entries.length === 0) return null

  return (
    <div>
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/45">
        Input Schema
      </p>
      <div className="flex flex-col gap-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
            <CodeIcon weight="duotone" className="size-3.5 shrink-0 text-teal-400/60" />
            <span className="text-[12.5px] font-medium text-white/85">{key}</span>
            <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">{val.type ?? "any"}</span>
            {required.includes(key) && (
              <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">required</span>
            )}
            {val.default !== undefined && (
              <span className="text-[10.5px] text-white/40">default: {String(val.default)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ detail }: { detail: WorkflowDetail }) {
  const steps = detail.steps ?? []

  return (
    <div className="flex flex-col gap-5">
      {/* Meta pills */}
      <div className="flex flex-wrap gap-2">
        {detail.current_version != null && (
          <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70">
            v{detail.current_version}
          </span>
        )}
        {detail.stage && (
          <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70 capitalize">
            {detail.stage}
          </span>
        )}
        {detail.workflow_agent && (
          <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70">
            Workflow Agent
          </span>
        )}
      </div>

      {/* Steps */}
      {steps.length > 0 ? (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/45">
            Steps · {steps.length}
          </p>
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <StepNode key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-white/50">No steps defined for this workflow.</p>
      )}

      {/* Input schema */}
      {detail.input_schema && (
        <InputSchema schema={detail.input_schema} />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<WorkflowDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get<WorkflowSummary[]>("/workflows")
      .then(res => { if (!cancelled) setWorkflows(res ?? []) })
      .catch(() => { if (!cancelled) setWorkflows([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function selectWorkflow(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
      return
    }
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await api.get<WorkflowDetail>(`/workflows/${id}`)
      setDetail(res)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) return <Dots />

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-4">

      {/* ── Header */}
      <div>
        <h1 className="text-[28px] font-medium tracking-tight text-white">Workflows</h1>
        <p className="mt-1 text-[13px] text-white/70">
          {workflows.length === 0
            ? "No workflows registered yet."
            : `${workflows.length} workflow${workflows.length !== 1 ? "s" : ""} registered`}
        </p>
      </div>

      {workflows.length === 0 ? (
        /* ── Empty state */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/20">
            <TreeStructureIcon weight="duotone" className="size-7 text-teal-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/70">No workflows found</p>
            <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/50">
              Register a workflow in your backend to see it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {workflows.map((w, i) => {
              const badge = typeBadge(w)
              const isOpen = selectedId === w.id

              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.04, 0.2) }}
                >
                  {/* Row card */}
                  <button
                    onClick={() => selectWorkflow(w.id)}
                    className={cn(
                      "group w-full flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200",
                      isOpen
                        ? "border-teal-500/30 bg-teal-500/[0.07] shadow-[0_0_24px_rgba(20,184,166,0.10)]"
                        : "border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14]"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/25 to-teal-500/5 ring-1 ring-teal-500/25">
                      {w.is_factory
                        ? <FactoryIcon weight="duotone" className="size-5 text-teal-400" />
                        : w.is_component
                          ? <SquaresFourIcon weight="duotone" className="size-5 text-teal-400" />
                          : <TreeStructureIcon weight="duotone" className="size-5 text-teal-400" />
                      }
                    </div>

                    {/* Name + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[13.5px] font-semibold text-white">
                          {w.name ?? w.id}
                        </p>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium", badge.cls)}>
                          {badge.label}
                        </span>
                        {w.stage && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50 capitalize">
                            {w.stage}
                          </span>
                        )}
                      </div>
                      {w.description && (
                        <p className="mt-0.5 truncate text-[12px] text-white/65">{w.description}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-white/40 font-mono">{w.id}</p>
                    </div>

                    {/* Right: version + caret */}
                    <div className="flex shrink-0 items-center gap-2">
                      {w.current_version != null && (
                        <span className="text-[11px] text-white/50">v{w.current_version}</span>
                      )}
                      <CaretDownIcon
                        weight="bold"
                        className={cn(
                          "size-3.5 transition-all duration-200",
                          isOpen ? "text-teal-400 rotate-180" : "text-white/35 group-hover:text-white/60"
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
                              Could not load workflow details.
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
