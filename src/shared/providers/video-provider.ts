export interface VideoJoinResult {
  provider: 'daily' | 'mock'
  roomUrl: string | null
  token?: string | null
}

export interface VideoProvider {
  joinRoom(appointmentId: string): Promise<VideoJoinResult>
  leaveRoom(): void
  getLocalStream?(): MediaStream | null
  isConnected(): boolean
  getRoomUrl?(): string | null
}

export class MockVideoProvider implements VideoProvider {
  private connected = false
  private currentRoom: string | null = null

  async joinRoom(appointmentId: string): Promise<VideoJoinResult> {
    this.currentRoom = appointmentId
    this.connected = true
    return { provider: 'mock', roomUrl: null }
  }

  leaveRoom(): void {
    this.connected = false
    this.currentRoom = null
  }

  isConnected(): boolean {
    return this.connected
  }

  getRoomUrl(): string | null {
    return this.currentRoom
  }
}

export class DailyVideoProvider implements VideoProvider {
  private connected = false
  private roomUrl: string | null = null
  private fallback = new MockVideoProvider()

  async joinRoom(appointmentId: string): Promise<VideoJoinResult> {
    try {
      const { supabase } = await import('@/shared/api/supabase')
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { appointmentId },
      })
      if (error) throw error
      const payload = data as VideoJoinResult | null
      if (payload?.provider === 'daily' && payload.roomUrl) {
        this.connected = true
        this.roomUrl = payload.token
          ? `${payload.roomUrl}?t=${payload.token}`
          : payload.roomUrl
        return { ...payload, roomUrl: this.roomUrl }
      }
    } catch {
      // Fall back to mock when Daily is not configured.
    }
    const result = await this.fallback.joinRoom(appointmentId)
    this.connected = true
    this.roomUrl = null
    return result
  }

  leaveRoom(): void {
    this.connected = false
    this.roomUrl = null
    this.fallback.leaveRoom()
  }

  isConnected(): boolean {
    return this.connected
  }

  getRoomUrl(): string | null {
    return this.roomUrl
  }
}

export const videoProvider: VideoProvider = new DailyVideoProvider()
