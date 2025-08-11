// Core API Types for Artist App
export interface Artist {
  id: number;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  agency_id?: number;
}

export interface MonthDay {
  date: string; // YYYY-MM-DD
  count: number;
  bookings?: BookingPreview[];
}

export interface BookingPreview {
  id: number;
  bookingCode: string;
  title?: string;
  city?: string;
  status: string;
}

export interface BookingDetail {
  id: number;
  bookingCode: string;
  title?: string;
  eventDate: string;
  status: string;
  isConfirmed: boolean;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    timeZone?: string;
    wifiCredentials?: string;
    hospitalityNotes?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    loadInTime?: string;
    soundCheckTime?: string;
    showTime?: string;
    curfew?: string;
    parkingInfo?: string;
    dressing_room?: string;
    catering?: string;
  };
  stage?: {
    name: string;
    capacity: number;
    stageSize?: string;
    acoustics?: string;
    lighting?: string;
    soundSystem?: string;
  };
  financial?: {
    fee?: number;
    currency?: string;
    paymentStatus?: string;
    paymentDue?: string;
    expenses?: Array<{
      type: string;
      amount: number;
      description?: string;
    }>;
  };
  rider?: {
    technical?: string;
    hospitality?: string;
    dressing_room?: string;
    catering?: string;
    security?: string;
  };
  contacts?: Array<{
    name: string;
    role: string;
    phone?: string;
    email?: string;
  }>;
  contractsCount: number;
  checkedIn?: boolean;
  notes?: string;
  requirements?: Array<{
    type: string;
    description: string;
    status: 'pending' | 'confirmed' | 'not_available';
  }>;
}

export interface ItineraryItem {
  id: number;
  type: 'flight' | 'hotel' | 'transport' | 'schedule';
  start_time: string;
  end_time?: string;
  timezone?: string;
  location?: string;
  notes?: string;
  checked_in?: boolean;
  content?: Record<string, unknown>;
}

export interface Contract {
  id: number;
  number: string;
  status: string;
  booking_id: number;
  pdfUrl?: string;
}

export interface ChatThread {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participants: Array<{
    id: number;
    name: string;
    role?: string;
  }>;
}

export interface ChatMessage {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read_at?: string;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

// API Response Types
export interface CalendarResponse {
  days: MonthDay[];
}

export interface AuthResponse {
  token: string;
  user: Artist;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
