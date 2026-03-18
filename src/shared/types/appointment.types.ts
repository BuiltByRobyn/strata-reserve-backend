export interface AppointmentNotification {
  type: 'request_approved' | 'request_rejected' | 'appointment_cancelled' | 'appointment_rescheduled';
  message: string;
  reason: string | null;
  date: string;
}

export interface AvailableSlot {
  timeSlotId: number;
  slotTime: string;
  slotName: string;
}

export interface AvailableDay {
  date: string;
  slots: AvailableSlot[];
}
