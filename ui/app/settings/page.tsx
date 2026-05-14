"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  RobotIcon,
  UsersThreeIcon,
  TreeStructureIcon,
  CpuIcon,
  CheckCircleIcon,
  BrainIcon,
  ClockCounterClockwiseIcon,
  PulseIcon,
  CalendarIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentConfig {
  agent_id?: string
  id?: string
  name?: string
  description?: string
  model?: { id?: string; provider?: string; name?: string }
  memory?: { enabled?: boolean }
  storage?: { enabled?: boolean }
  knowledge?: { enabled?: boolean }
  tools?: unknown[]
}

interface TeamConfig {
  id: string
  name?: string
  mode?: string
}

interface WorkflowConfig {
  id: string
  name?: string
}

interface ConfigResponse {
  agents?: AgentConfig[]
  teams?: TeamConfig[]
  workflows?: WorkflowConfig[]
  metrics?: { enabled?: boolean }
  memory?: { enabled?: boolean }
  scheduler?: { enabled?: boolean }
  tracing?: { enabled?: boolean }
}

interface ModelInfo {
  id?: string
  name?: string
  provider?: string
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

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-4">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1", color)}>
        <Icon weight="duotone" className="size-5" />
      </div>
      <div>
        <p className="text-[22px] font-semibold leading-none text-white">{value}</p>
        <p className="mt-1 text-[11.5px] text-white/55">{label}</p>
      </div>
    </div>
  )
}

// ── Feature flag row ──────────────────────────────────────────────────────────

function FeatureRow({
  icon: Icon,
  label,
  enabled,
}: {
  icon: React.ElementType
  label: string
  enabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
      <Icon weight="duotone" className="size-4 text-white/50" />
      <span className="flex-1 text-[12.5px] text-white/75">{label}</span>
      <span className={cn(
        "rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ring-1",
        enabled
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20"
          : "bg-white/[0.05] text-white/35 ring-white/[0.08]"
      )}>
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [config, setConfig]   = useState<ConfigResponse | null>(null)
  const [models, setModels]   = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<ConfigResponse>("/config").catch(() => null),
      api.get<unknown>("/models").catch(() => null),
    ]).then(([cfg, mdls]) => {
      setConfig(cfg)
      const modelList = Array.isArray(mdls)
        ? mdls as ModelInfo[]
        : Array.isArray((mdls as Record<string, unknown>)?.models)
          ? (mdls as Record<string, unknown>).models as ModelInfo[]
          : []
      setModels(modelList)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Dots />

  const agents    = config?.agents ?? []
  const teams     = config?.teams ?? []
  const workflows = config?.workflows ?? []

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-4">

      {/* ── Header */}
      <div>
        <h1 className="text-[28px] font-medium tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-[13px] text-white/70">Platform configuration overview</p>
      </div>

      {/* ── Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={RobotIcon}
          label="Agents"
          value={agents.length}
          color="bg-gradient-to-br from-violet-500/25 to-violet-500/5 ring-violet-500/25 text-violet-400"
        />
        <StatCard
          icon={UsersThreeIcon}
          label="Teams"
          value={teams.length}
          color="bg-gradient-to-br from-orange-500/25 to-orange-500/5 ring-orange-500/25 text-orange-400"
        />
        <StatCard
          icon={TreeStructureIcon}
          label="Workflows"
          value={workflows.length}
          color="bg-gradient-to-br from-teal-500/25 to-teal-500/5 ring-teal-500/25 text-teal-400"
        />
      </div>

      {/* ── Agents */}
      {agents.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Agents</p>
          <div className="flex flex-col gap-2">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.agent_id ?? i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.05 }}
                className="flex items-start gap-4 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-violet-500/5 ring-1 ring-violet-500/25">
                  <RobotIcon weight="duotone" className="size-5 text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-white">{agent.name ?? agent.agent_id ?? agent.id}</p>
                    {agent.model?.id && (
                      <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10.5px] text-white/60 ring-1 ring-white/[0.08]">
                        <CpuIcon weight="duotone" className="size-3" />
                        {agent.model.id}
                      </span>
                    )}
                  </div>
                  {agent.description && (
                    <p className="mt-0.5 text-[12px] text-white/60">{agent.description}</p>
                  )}
                  <p className="mt-0.5 font-mono text-[10.5px] text-white/35">{agent.agent_id ?? agent.id}</p>
                  {/* Capability tags */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agent.memory?.enabled && (
                      <span className="flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] text-pink-300 ring-1 ring-pink-500/20">
                        <BrainIcon weight="duotone" className="size-3" /> Memory
                      </span>
                    )}
                    {agent.storage?.enabled && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300 ring-1 ring-amber-500/20">
                        <ClockCounterClockwiseIcon weight="duotone" className="size-3" /> Storage
                      </span>
                    )}
                    {agent.knowledge?.enabled && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300 ring-1 ring-blue-500/20">
                        <CheckCircleIcon weight="duotone" className="size-3" /> Knowledge
                      </span>
                    )}
                    {agent.tools && agent.tools.length > 0 && (
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">
                        {agent.tools.length} tool{agent.tools.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Models in use */}
      {models.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Models in Use</p>
          <div className="flex flex-col gap-1.5">
            {models.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5"
              >
                <CpuIcon weight="duotone" className="size-4 text-white/40" />
                <span className="flex-1 text-[12.5px] font-medium text-white/85">{m.id ?? m.name ?? "Unknown"}</span>
                {m.provider && (
                  <span className="text-[11px] text-white/45 capitalize">{m.provider}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Platform features */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Platform Features</p>
        <div className="flex flex-col gap-1.5">
          <FeatureRow icon={BrainIcon}               label="Agentic Memory"  enabled={config?.memory?.enabled ?? agents.some(a => a.memory?.enabled)} />
          <FeatureRow icon={PulseIcon}               label="Tracing"         enabled={config?.tracing?.enabled} />
          <FeatureRow icon={CalendarIcon}            label="Scheduler"       enabled={config?.scheduler?.enabled} />
          <FeatureRow icon={ClockCounterClockwiseIcon} label="Sessions"      enabled />
        </div>
      </section>
    </div>
  )
}
