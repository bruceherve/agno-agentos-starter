const API_URL = "/api"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
}

export interface AguiCallbacks {
  onStart: (messageId: string) => void
  onDelta: (messageId: string, delta: string) => void
  onEnd: () => void
  onError: (msg: string) => void
}

export async function streamAgui(
  threadId: string,
  userMessage: { id: string; content: string },
  signal: AbortSignal,
  cbs: AguiCallbacks
): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/agui`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        threadId,
        runId: crypto.randomUUID(),
        state: {},
        messages: [{ id: userMessage.id, role: "user", content: userMessage.content }],
        tools: [],
        context: [],
        forwardedProps: {},
      }),
    })
  } catch (e) {
    if ((e as Error).name === "AbortError") return
    cbs.onError(e instanceof Error ? e.message : "Network error")
    return
  }

  if (!res.ok) {
    cbs.onError(`${res.status} ${res.statusText}`)
    return
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split("\n")
      buf = lines.pop() ?? ""
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const json = line.slice(6).trim()
        if (!json) continue
        try {
          const ev = JSON.parse(json)
          if (ev.type === "TEXT_MESSAGE_START") cbs.onStart(ev.messageId)
          else if (ev.type === "TEXT_MESSAGE_CONTENT" && ev.delta) cbs.onDelta(ev.messageId, ev.delta)
          else if (ev.type === "RUN_FINISHED") cbs.onEnd()
          else if (ev.type === "RUN_ERROR") cbs.onError(ev.message ?? "Unknown error")
        } catch { /* malformed line */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

