/**
 * Appointment and scheduling type definitions
 */

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AvailableSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  display: string;   // "9:00 AM - 9:30 AM"
}

export interface AppointmentStatus {
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface BookingFormData {
  appointmentTypeId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  notes?: string;
}
