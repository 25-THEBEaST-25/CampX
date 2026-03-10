// ============================================
// Ably Realtime Client — Token-authenticated connection
// ============================================

import Ably from "ably"
import { api } from "@/lib/api"

let realtimeClient: Ably.Realtime | null = null

/**
 * Returns a singleton Ably Realtime client authenticated via backend token.
 * The client uses token-based auth: it calls our API to get a short-lived
 * TokenRequest, which Ably exchanges for a real connection token.
 */
export function getAblyClient(): Ably.Realtime {
  if (realtimeClient) return realtimeClient

  realtimeClient = new Ably.Realtime({
    authCallback: async (_params, callback) => {
      try {
        const tokenRequest = await api.post<Ably.TokenRequest>(
          "/api/ably/token"
        )
        callback(null, tokenRequest)
      } catch (err) {
        callback(err as Error, null)
      }
    },
    autoConnect: false,
    echoMessages: false,
  })

  return realtimeClient
}

/**
 * Connects the Ably client. Safe to call multiple times — only connects if disconnected.
 */
export function connectAbly(): void {
  const client = getAblyClient()
  if (
    client.connection.state !== "connected" &&
    client.connection.state !== "connecting"
  ) {
    client.connect()
  }
}

/**
 * Disconnects the Ably client and cleans up the singleton.
 */
export function disconnectAbly(): void {
  if (realtimeClient) {
    realtimeClient.close()
    realtimeClient = null
  }
}

/**
 * Subscribe to a channel and event. Returns an unsubscribe function.
 */
export function subscribeToChannel(
  channelName: string,
  eventName: string,
  callback: (message: Ably.Message) => void
): () => void {
  const client = getAblyClient()
  const channel = client.channels.get(channelName)
  channel.subscribe(eventName, callback)

  return () => {
    channel.unsubscribe(eventName, callback)
  }
}
