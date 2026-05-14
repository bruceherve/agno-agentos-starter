"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  UsersThreeIcon,
  RobotIcon,
  ArrowRightIcon,
  ChatsCircleIcon,
} from "@phosphor-icons/react"
import { api } from "@/lib/api"

interface Member {
  id: string
  name: string
  description?: string
}

interface Team {
  id: string
  name: string
  description?: string
  mode?: string
  members?: Member[]
}

interface ConfigResponse {
  teams: Team[]
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Team | null>(null)

  useEffect(() => {
    api.get<ConfigResponse>("/config")
      .then(data => setTeams(data.teams ?? []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
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

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">
      <div>
        <h1 className="text-[28px] font-medium tracking-tight text-white">Teams</h1>
        <p className="mt-1 text-[13px] text-white/50">
          {teams.length === 0
            ? "No agent teams registered yet."
            : `${teams.length} team${teams.length > 1 ? "s" : ""} available — select one to chat with its agents.`}
        </p>
      </div>

      {teams.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
            <UsersThreeIcon weight="duotone" className="size-7 text-orange-400/50" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/40">No teams available</p>
            <p className="mt-1 text-[12px] text-white/25 max-w-xs leading-relaxed">
              Register a team of agents in your backend to see them here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Team cards ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelected(selected?.id === team.id ? null : team)}
                className={`group flex flex-col gap-4 rounded-3xl border p-5 text-left transition-all duration-200
                  ${selected?.id === team.id
                    ? "border-orange-500/30 bg-orange-500/10 shadow-[0_0_24px_rgba(249,115,22,0.12)]"
                    : "border-white/[0.09] bg-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.15]"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/25 to-orange-500/5 ring-1 ring-orange-500/25">
                    <UsersThreeIcon weight="duotone" className="size-5 text-orange-400" />
                  </div>
                  <ArrowRightIcon
                    weight="bold"
                    className={`size-4 mt-1 shrink-0 transition-all duration-200 ${
                      selected?.id === team.id ? "text-orange-400 rotate-90" : "text-white/20 group-hover:text-white/40"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-white">{team.name}</p>
                  {team.description && (
                    <p className="mt-1 text-[12.5px] text-white/60 leading-relaxed">{team.description}</p>
                  )}
                  {team.mode && (
                    <span className="mt-2 inline-block rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[10.5px] font-medium text-white/40 capitalize">
                      {team.mode} mode
                    </span>
                  )}
                  <p className="mt-2 text-[11.5px] text-white/30">
                    {team.members?.length ?? 0} agent{(team.members?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Agent list for selected team ── */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 rounded-3xl border border-white/[0.09] bg-white/[0.03] p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                  Agents in {selected.name}
                </p>

                {!selected.members || selected.members.length === 0 ? (
                  <p className="text-[13px] text-white/30 py-4 text-center">No agents in this team.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selected.members.map(member => (
                      <button
                        key={member.id}
                        onClick={() => router.push(`/chat?agent=${member.id}`)}
                        className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left transition-all hover:bg-white/[0.08] hover:border-white/[0.14]"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 ring-1 ring-indigo-500/25">
                          <RobotIcon weight="duotone" className="size-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-white">{member.name}</p>
                          {member.description && (
                            <p className="truncate text-[11px] text-white/40 mt-0.5">{member.description}</p>
                          )}
                        </div>
                        <ChatsCircleIcon weight="duotone" className="size-4 text-white/20 shrink-0 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}