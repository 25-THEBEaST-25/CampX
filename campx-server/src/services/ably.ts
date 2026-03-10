import Ably from "ably"

const ably = new Ably.Rest(process.env.ABLY_API_KEY ?? "")

/**
 * Publishes a message to an Ably channel.
 * Used for real-time notifications and chat messages.
 *
 * @param channelName - The Ably channel to publish to (e.g., "user:123:notifications")
 * @param eventName   - The event name within the channel (e.g., "new-notification")
 * @param data        - The payload to deliver to subscribers
 */
export async function publishToChannel(
  channelName: string,
  eventName: string,
  data: Record<string, unknown>
): Promise<void> {
  const channel = ably.channels.get(channelName)
  await channel.publish(eventName, data)
}

/**
 * Returns the Ably REST client for advanced usage.
 */
export function getAblyClient(): Ably.Rest {
  return ably
}

/**
 * Generates a short-lived Ably token request for the given client ID.
 * The frontend exchanges this for a real-time connection token.
 *
 * @param clientId - Unique identifier for the client (typically the userId)
 * @returns TokenRequest object that the frontend passes to `new Ably.Realtime({ authCallback })`
 */
export async function createTokenRequest(
  clientId: string
): Promise<Ably.TokenRequest> {
  return ably.auth.createTokenRequest({
    clientId,
    capability: {
      [`user:${clientId}:notifications`]: ["subscribe"],
      ["conversation:*"]: ["subscribe", "publish", "presence"],
    },
  })
}
