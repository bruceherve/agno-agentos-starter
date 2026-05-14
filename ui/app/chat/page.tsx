"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpIcon, SparkleIcon, PlusIcon, RocketLaunchIcon, LightningIcon, BookOpenIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { streamAgui } from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
  id: string
}

const SUGGESTIONS = [
  { text: "How do I add a second agent?", icon: RocketLaunchIcon, color: "from-violet-500/20 to-violet-500/5", ring: "ring-violet-500/20", iconColor: "text-violet-400" },
  { text: "What does DB_URI do?",         icon: LightningIcon,     color: "from-amber-500/20 to-amber-500/5",  ring: "ring-amber-500/20",  iconColor: "text-amber-400"  },
  { text: "Explain agent memory",         icon: BookOpenIcon,      color: "from-cyan-500/20 to-cyan-500/5",    ring: "ring-cyan-500/20",   iconColor: "text-cyan-400"   },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadIdRef = useRef(crypto.randomUUID())
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [input])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput("")

    const userMsg: Message = { role: "user", content: text, id: crypto.randomUUID() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const abort = new AbortController()
    abortRef.current = abort

    await streamAgui(threadIdRef.current, { id: userMsg.id, content: text }, abort.signal, {
      onStart: (messageId) => {
        setMessages(prev => [...prev, { role: "assistant", content: "", id: messageId }])
        setLoading(false)
      },
      onDelta: (messageId, delta) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: m.content + delta } : m))
      },
      onEnd: () => {
        setLoading(false)
      },
      onError: (msg) => {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${msg}`, id: crypto.randomUUID() }])
        setLoading(false)
      },
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full -m-6 overflow-hidden">

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 px-6 pt-10 max-w-xl mx-auto w-full text-center"
          >
            {/* Icon */}
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-primary/25 shadow-[0_0_48px_rgba(139,92,246,0.2)]">
              <SparkleIcon weight="duotone" className="size-6 text-primary" />
            </div>

            {/* Heading */}
            <p className="text-[28px] font-medium tracking-tight text-foreground">
              How can I help?
            </p>

            {/* Colorful suggestion cards */}
            <div className="flex flex-col gap-2.5 w-full">
              {SUGGESTIONS.map(({ text, icon: Icon, color, ring, iconColor }) => (
                <button
                  key={text}
                  onClick={() => { setInput(text); textareaRef.current?.focus() }}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 text-left transition-all duration-200 hover:bg-white/[0.07] hover:border-white/[0.12]"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} ring-1 ${ring}`}>
                    <Icon weight="duotone" className={`size-4 ${iconColor}`} />
                  </div>
                  <span className="text-[13px] font-medium text-foreground/85 group-hover:text-white transition-colors">
                    {text}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-5 px-6 py-6 max-w-2xl mx-auto w-full">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn("flex gap-3", m.role === "user" && "justify-end")}
                >
                  {m.role === "assistant" && (
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-white/10 mt-0.5">
                      <SparkleIcon weight="duotone" className="size-3 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "rounded-3xl px-5 py-3 text-[13.5px] leading-relaxed max-w-[80%]",
                    m.role === "user"
                      ? "bg-primary/90 text-white rounded-tr-md"
                      : "bg-white/[0.06] text-foreground/90 rounded-tl-md ring-1 ring-white/[0.08]"
                  )}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-white/10 mt-0.5">
                  <SparkleIcon weight="duotone" className="size-3 text-primary" />
                </div>
                <div className="flex items-center gap-1 rounded-3xl rounded-tl-md bg-white/[0.06] px-5 py-3 ring-1 ring-white/[0.08]">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-muted-foreground/50"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="px-6 pb-5 pt-3 max-w-2xl mx-auto w-full">
        <div className="flex items-end gap-2 rounded-full border border-white/[0.22] bg-white/[0.08] pl-2.5 pr-2.5 py-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-200 focus-within:border-primary/60 focus-within:bg-white/[0.10] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.18),0_4px_24px_rgba(0,0,0,0.3)]">
          {/* + button */}
          <button className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-white/70 transition-all hover:bg-white/[0.20] hover:text-white">
            <PlusIcon weight="bold" className="size-4" />
          </button>

          {/* textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message starter-agent…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-[13.5px] leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
            style={{ minHeight: "24px", maxHeight: "160px" }}
          />

          {/* send button */}
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            whileTap={{ scale: 0.9 }}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition-all disabled:opacity-25 disabled:shadow-none hover:brightness-110"
          >
            <ArrowUpIcon weight="bold" className="size-4" />
          </motion.button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/25">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}