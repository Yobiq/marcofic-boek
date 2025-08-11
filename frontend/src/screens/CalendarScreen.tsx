import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { artistService } from '../services/artist';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BookingDetail } from '../types';

interface Booking {
  id: number;
  bookingCode: string;
  title: string;
  city: string;
  status: string;
  eventDate?: string;
  venue?: {
    name: string;
    city: string;
    country: string;
    timeZone: string;
  };
  stage?: {
    name: string;
    capacity: number;
  };
}

interface MonthDay {
  date: string;
  count: number;
  bookings: Booking[];
}

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    .toISOString().split('T')[0];
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    .toISOString().split('T')[0];

  const {
    data: calendarData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['calendar', monthStart, monthEnd],
    queryFn: () => artistService.getCalendar(monthStart, monthEnd),
  });

  // Query for full booking details when a booking is selected
  const {
    data: fullBookingDetails,
    isLoading: isLoadingBookingDetails,
  } = useQuery({
    queryKey: ['booking', selectedBookingId],
    queryFn: () => artistService.getBooking(selectedBookingId!),
    enabled: !!selectedBookingId,
  });

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  }, []);

  const handleDayPress = useCallback((day: MonthDay) => {
    setSelectedDate(day.date);
  }, []);

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedBookingId(booking.id);
    setShowBookingModal(true);
  };

  const viewBookingDetails = () => {
    setShowBookingModal(false);
    if (selectedBooking) {
      // Navigate to booking details screen
      navigation.navigate('Bookings' as never);
    }
  };

  const viewItinerary = () => {
    setShowBookingModal(false);
    if (selectedBooking) {
      // Navigate to itinerary screen with booking context
      navigation.navigate('Itinerary' as never);
    }
  };

  const viewTeamChat = () => {
    setShowBookingModal(false);
    navigation.navigate('Chat' as never);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking.updated': return colors.primary;
      case 'itinerary.updated': return '#28a745';
      case 'chat.message': return '#17a2b8';
      case 'contract.signed': return '#ffc107';
      case 'payment.received': return '#28a745';
      case 'team.invitation': return '#6f42c1';
      case 'system.update': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  const navigateToItinerary = () => {
    setShowBookingModal(false);
    navigation.navigate('Itinerary' as never);
  };

  const navigateToChat = () => {
    setShowBookingModal(false);
    navigation.navigate('Chat' as never);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={[styles.dayCell, { borderColor: colors.border }]} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData?.days.find(d => d.date === dateStr);
      const isSelected = dateStr === selectedDate;
      const hasBookings = dayData && dayData.count > 0;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            { borderColor: colors.border },
            isSelected && { backgroundColor: colors.primary },
            hasBookings && !isSelected && { backgroundColor: colors.primary + '20' },
            isToday && !isSelected && !hasBookings && { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.primary },
          ]}
          onPress={() => dayData && handleDayPress(dayData)}
        >
          <Text style={[
            styles.dayText,
            { color: colors.text },
            isSelected && { color: '#fff', fontWeight: 'bold' },
            hasBookings && !isSelected && { color: colors.primary, fontWeight: '600' },
            isToday && !isSelected && !hasBookings && { color: colors.primary, fontWeight: 'bold' },
          ]}>
            {day}
          </Text>
          {hasBookings && (
            <View style={[styles.bookingIndicator, { backgroundColor: isSelected ? '#fff' : colors.error }]}>
              <Text style={[styles.bookingCount, { color: isSelected ? colors.primary : '#fff' }]}>
                {dayData.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const styles = createStyles(colors, isDark);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Error loading calendar</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Days of week header */}
        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {renderCalendarGrid()}
        </View>

        {/* Selected date info */}
        {selectedDate && (
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {calendarData?.days.find(d => d.date === selectedDate)?.bookings?.length ? (
              calendarData.days.find(d => d.date === selectedDate)?.bookings.map(booking => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingItem}
                  onPress={() => handleBookingPress(booking)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
                    <View style={styles.statusContainer}>
                      <Ionicons 
                        name={getStatusIcon(booking.status)} 
                        size={16} 
                        color={getStatusColor(booking.status)} 
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.bookingTitle}>{booking.title}</Text>
                  
                  <View style={styles.bookingDetails}>
                    <View style={styles.locationContainer}>
                      <Ionicons name="location" size={14} color={colors.textSecondary} />
                      <Text style={styles.bookingCity}>{booking.city}</Text>
                    </View>
                    <TouchableOpacity style={styles.viewMoreButton}>
                      <Text style={styles.viewMoreText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noBookingsContainer}>
                <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.noBookingsText}>No bookings on this date</Text>
              </View>
            )}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Selected Date</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.primary + '20' }]} />
              <Text style={styles.legendText}>Has Bookings</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { borderWidth: 2, borderColor: colors.primary }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booking Details Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity
              onPress={() => setShowBookingModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {fullBookingDetails && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Header Card */}
              <View style={styles.bookingDetailCard}>
                <View style={styles.bookingDetailHeader}>
                  <Text style={styles.bookingDetailCode}>{fullBookingDetails.bookingCode}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fullBookingDetails.status) + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(fullBookingDetails.status)} 
                      size={16} 
                      color={getStatusColor(fullBookingDetails.status)} 
                    />
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(fullBookingDetails.status) }]}>
                      {fullBookingDetails.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bookingDetailTitle}>{fullBookingDetails.title || 'Event Title'}</Text>

                {/* Event Details */}
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Event Details</Text>
                </View>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(fullBookingDetails.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.detailValue}>
                      {new Date(fullBookingDetails.eventDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Venue Information */}
              {fullBookingDetails.venue && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="business" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Venue Information</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Venue Name</Text>
                      <Text style={styles.detailValue}>{fullBookingDetails.venue.name}</Text>
                      {fullBookingDetails.venue.address && (
                        <Text style={styles.detailSubValue}>{fullBookingDetails.venue.address}</Text>
                      )}
                      {fullBookingDetails.venue.city && (
                        <Text style={styles.detailSubValue}>
                          {fullBookingDetails.venue.city}, {fullBookingDetails.venue.country}
                        </Text>
                      )}
                    </View>

                    {fullBookingDetails.venue.contactPerson && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Venue Contact</Text>
                        <Text style={styles.detailValue}>{fullBookingDetails.venue.contactPerson}</Text>
                        {fullBookingDetails.venue.contactPhone && (
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`tel:${fullBookingDetails.venue?.contactPhone}`)}
                            style={styles.contactButton}
                          >
                            <Text style={[styles.detailSubValue, { color: colors.primary }]}>
                              📞 {fullBookingDetails.venue.contactPhone}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {fullBookingDetails.venue.contactEmail && (
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`mailto:${fullBookingDetails.venue?.contactEmail}`)}
                            style={styles.contactButton}
                          >
                            <Text style={[styles.detailSubValue, { color: colors.primary }]}>
                              ✉️ {fullBookingDetails.venue.contactEmail}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Schedule Information */}
                    {(fullBookingDetails.venue.loadInTime || fullBookingDetails.venue.soundCheckTime || fullBookingDetails.venue.showTime) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Schedule</Text>
                        {fullBookingDetails.venue.loadInTime && (
                          <Text style={styles.detailValue}>🚚 Load-in: {fullBookingDetails.venue.loadInTime}</Text>
                        )}
                        {fullBookingDetails.venue.soundCheckTime && (
                          <Text style={styles.detailValue}>🎵 Soundcheck: {fullBookingDetails.venue.soundCheckTime}</Text>
                        )}
                        {fullBookingDetails.venue.showTime && (
                          <Text style={styles.detailValue}>🎤 Show: {fullBookingDetails.venue.showTime}</Text>
                        )}
                        {fullBookingDetails.venue.curfew && (
                          <Text style={styles.detailValue}>⏰ Curfew: {fullBookingDetails.venue.curfew}</Text>
                        )}
                      </View>
                    )}

                    {/* Facilities */}
                    {(fullBookingDetails.venue.parkingInfo || fullBookingDetails.venue.wifiCredentials) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Facilities</Text>
                        {fullBookingDetails.venue.parkingInfo && (
                          <Text style={styles.detailValue}>🚗 Parking: {fullBookingDetails.venue.parkingInfo}</Text>
                        )}
                        {fullBookingDetails.venue.wifiCredentials && (
                          <Text style={styles.detailValue}>📶 WiFi: {fullBookingDetails.venue.wifiCredentials}</Text>
                        )}
                        {fullBookingDetails.venue.dressing_room && (
                          <Text style={styles.detailValue}>🚪 Dressing Room: {fullBookingDetails.venue.dressing_room}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Stage & Technical */}
              {fullBookingDetails.stage && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="musical-notes" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Stage & Technical</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Stage Information</Text>
                      <Text style={styles.detailValue}>{fullBookingDetails.stage.name}</Text>
                      <Text style={styles.detailSubValue}>
                        Capacity: {fullBookingDetails.stage.capacity.toLocaleString()}
                      </Text>
                      {fullBookingDetails.stage.stageSize && (
                        <Text style={styles.detailSubValue}>Size: {fullBookingDetails.stage.stageSize}</Text>
                      )}
                    </View>

                    {(fullBookingDetails.stage.soundSystem || fullBookingDetails.stage.lighting) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Technical Specs</Text>
                        {fullBookingDetails.stage.soundSystem && (
                          <Text style={styles.detailValue}>🔊 Sound: {fullBookingDetails.stage.soundSystem}</Text>
                        )}
                        {fullBookingDetails.stage.lighting && (
                          <Text style={styles.detailValue}>💡 Lighting: {fullBookingDetails.stage.lighting}</Text>
                        )}
                        {fullBookingDetails.stage.acoustics && (
                          <Text style={styles.detailValue}>🎼 Acoustics: {fullBookingDetails.stage.acoustics}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Financial Information */}
              {fullBookingDetails.financial && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="card" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Financial Details</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    {fullBookingDetails.financial.fee && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Performance Fee</Text>
                        <Text style={[styles.detailValue, { color: colors.success, fontSize: 20, fontWeight: 'bold' }]}>
                          {fullBookingDetails.financial.currency || '$'}{fullBookingDetails.financial.fee.toLocaleString()}
                        </Text>
                        {fullBookingDetails.financial.paymentStatus && (
                          <Text style={styles.detailSubValue}>
                            Status: {fullBookingDetails.financial.paymentStatus}
                          </Text>
                        )}
                        {fullBookingDetails.financial.paymentDue && (
                          <Text style={styles.detailSubValue}>
                            Due: {fullBookingDetails.financial.paymentDue}
                          </Text>
                        )}
                      </View>
                    )}

                    {fullBookingDetails.financial.expenses && fullBookingDetails.financial.expenses.length > 0 && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Expenses</Text>
                        {fullBookingDetails.financial.expenses.map((expense, index) => (
                          <Text key={index} style={styles.detailValue}>
                            {expense.type}: {fullBookingDetails.financial?.currency || '$'}{expense.amount}
                            {expense.description && ` (${expense.description})`}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Contacts */}
              {fullBookingDetails.contacts && fullBookingDetails.contacts.length > 0 && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="people" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Key Contacts</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    {fullBookingDetails.contacts.map((contact, index) => (
                      <View key={index} style={styles.detailItem}>
                        <Text style={styles.detailLabel}>{contact.role}</Text>
                        <Text style={styles.detailValue}>{contact.name}</Text>
                        {contact.phone && (
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                            style={styles.contactButton}
                          >
                            <Text style={[styles.detailSubValue, { color: colors.primary }]}>
                              📞 {contact.phone}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {contact.email && (
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                            style={styles.contactButton}
                          >
                            <Text style={[styles.detailSubValue, { color: colors.primary }]}>
                              ✉️ {contact.email}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Requirements */}
              {fullBookingDetails.requirements && fullBookingDetails.requirements.length > 0 && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="list" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Requirements</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    {fullBookingDetails.requirements.map((req, index) => (
                      <View key={index} style={styles.requirementItem}>
                        <View style={styles.requirementHeader}>
                          <Text style={styles.detailLabel}>{req.type}</Text>
                          <View style={[
                            styles.requirementStatus,
                            { backgroundColor: req.status === 'confirmed' ? colors.success + '20' : 
                                               req.status === 'pending' ? colors.warning + '20' : colors.error + '20' }
                          ]}>
                            <Text style={[
                              styles.requirementStatusText,
                              { color: req.status === 'confirmed' ? colors.success : 
                                      req.status === 'pending' ? colors.warning : colors.error }
                            ]}>
                              {req.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.detailValue}>{req.description}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Notes */}
              {fullBookingDetails.notes && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Additional Notes</Text>
                  </View>
                  <Text style={styles.notesText}>{fullBookingDetails.notes}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={navigateToItinerary}>
                  <Ionicons name="map" size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>View Itinerary</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={navigateToChat}>
                  <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Team Chat</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="document" size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>View Contracts</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {isLoadingBookingDetails && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
  },
  bookingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCount: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedDateInfo: {
    margin: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  bookingItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingCity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  noBookingsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noBookingsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  legend: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 40,
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bookingDetailCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  bookingDetailCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
    minWidth: 120,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 26,
    flexWrap: 'wrap',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  detailSubValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  contactButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 2,
    borderRadius: 4,
  },
  requirementItem: {
    marginBottom: 10,
    backgroundColor: colors.background + '50',
    padding: 12,
    borderRadius: 8,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  requirementStatus: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  requirementStatusText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
    padding: 4,
    flexWrap: 'wrap',
  },
  actionButtons: {
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
    flexWrap: 'wrap',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});