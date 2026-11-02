export type Status = 'confirmed' | 'cancelled' | 'late_cancelled'

export type Room = {
  id: string
  name: string
  capacity: number
  maintenanceStart: Date | null
  maintenanceEnd: Date | null
}

export type Booking = {
  id: string
  roomId: string
  memberId: string
  start: Date
  end: Date
  status: Status
}
