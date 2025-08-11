import api from './api';
import { 
  CalendarResponse, 
  BookingDetail, 
  ItineraryItem, 
  Contract, 
  ChatThread, 
  ChatMessage, 
  Notification, 
  Contact 
} from '../types';

export const artistService = {
  // Calendar
  async getCalendar(from: string, to: string): Promise<CalendarResponse> {
    const response = await api.get<CalendarResponse>('/artist/calendar', {
      params: { from, to }
    });
    return response.data;
  },

  // Bookings
  async getBookings(params?: { from?: string; to?: string; status?: string }): Promise<{ bookings: BookingDetail[] }> {
    const response = await api.get<{ bookings: BookingDetail[] }>('/artist/bookings', { params });
    return response.data;
  },

  async getBooking(id: number): Promise<BookingDetail> {
    const response = await api.get<BookingDetail>(`/artist/bookings/${id}`);
    return response.data;
  },

  async checkInBooking(id: number): Promise<{ checked_in: boolean }> {
    const response = await api.post(`/bookings/${id}/check-in`);
    return response.data;
  },

  // Itinerary
  async getBookingItinerary(bookingId: number): Promise<ItineraryItem[]> {
    const response = await api.get<ItineraryItem[]>(`/bookings/${bookingId}/itinerary`);
    return response.data;
  },

  async getTourItinerary(tourId: number): Promise<ItineraryItem[]> {
    const response = await api.get<ItineraryItem[]>(`/tours/${tourId}/itinerary`);
    return response.data;
  },

  async checkInItineraryItem(id: number): Promise<{ checked_in: boolean }> {
    const response = await api.post(`/itinerary-items/${id}/check-in`);
    return response.data;
  },

  // Contracts
  async getBookingContracts(bookingId: number): Promise<Contract[]> {
    const response = await api.get<Contract[]>(`/bookings/${bookingId}/contracts`);
    return response.data;
  },

  async getContract(id: number): Promise<Contract> {
    const response = await api.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  async getContractPdf(id: number): Promise<{ signedUrl: string }> {
    const response = await api.get(`/contracts/${id}/pdf`);
    return response.data;
  },

  // Chat & Contacts
  async getContacts(): Promise<Contact[]> {
    const response = await api.get<Contact[]>('/artist/contacts');
    return response.data;
  },

  async getChatThreads(): Promise<ChatThread[]> {
    const response = await api.get<ChatThread[]>('/chat/threads');
    return response.data;
  },

  async getChatMessages(threadId: number, page = 1): Promise<{ data: ChatMessage[], hasMore: boolean }> {
    const response = await api.get(`/chat/threads/${threadId}`, {
      params: { page }
    });
    return response.data;
  },

  async sendMessage(threadId: number, content: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>('/chat/messages', {
      thread_id: threadId,
      content
    });
    return response.data;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  async markNotificationsRead(ids: number[]): Promise<void> {
    await api.post('/notifications/read', { ids });
  },

  // Device registration for push notifications
  async registerDevice(expoPushToken: string): Promise<void> {
    await api.patch('/devices', { expoPushToken });
  },

  // Profile
  async getProfile(): Promise<any> {
    const response = await api.get('/artist/profile');
    return response.data;
  },

  async updateProfile(data: Partial<{ name: string; bio: string; avatar: string }>): Promise<any> {
    const response = await api.put('/artist/profile', data);
    return response.data;
  },

  async uploadAvatar(imageUri: string): Promise<{ avatar: string }> {
    // Extract file extension from URI
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
    
    // Determine MIME type based on extension
    const getMimeType = (ext: string) => {
      switch (ext.toLowerCase()) {
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        default: return 'image/jpeg';
      }
    };

    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: getMimeType(fileExtension),
      name: `avatar.${fileExtension}`,
    } as any);

    const response = await api.post<{ avatar: string }>('/artist/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
