import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { artistService } from '../services/artist';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BookingDetail } from '../types';

export default function BookingsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings', selectedStatus === 'all' ? undefined : selectedStatus],
    queryFn: () => artistService.getBookings({
      status: selectedStatus === 'all' ? undefined : selectedStatus
    }),
  });

  const bookings = bookingsData?.bookings || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: BookingDetail) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleCheckIn = async (booking: BookingDetail) => {
    try {
      await artistService.checkInBooking(booking.id);
      refetch();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
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

  const navigateToItinerary = () => {
    setShowDetailModal(false);
    navigation.navigate('Itinerary' as never);
  };

  const navigateToChat = () => {
    setShowDetailModal(false);
    navigation.navigate('Chat' as never);
  };

  const renderBookingItem = ({ item: booking }: { item: BookingDetail }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleBookingPress(booking)}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(booking.status)} 
            size={14} 
            color={getStatusColor(booking.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.bookingTitle}>{booking.title || 'No title'}</Text>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(booking.eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        {booking.venue && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {booking.venue.name}
              {booking.venue.city && `, ${booking.venue.city}`}
              {booking.venue.country && `, ${booking.venue.country}`}
            </Text>
          </View>
        )}

        {booking.stage && (
          <View style={styles.detailRow}>
            <Ionicons name="musical-notes" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {booking.stage.name} (Capacity: {booking.stage.capacity.toLocaleString()})
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {booking.contractsCount} contract{booking.contractsCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {booking.financial && (
          <View style={styles.detailRow}>
            <Ionicons name="card" size={16} color={colors.success} />
            <Text style={[styles.detailText, { color: colors.success, fontWeight: '600' }]}>
              {booking.financial.currency || '$'}{booking.financial.fee?.toLocaleString()} 
              {booking.financial.paymentStatus && ` (${booking.financial.paymentStatus})`}
            </Text>
          </View>
        )}

        {booking.venue?.showTime && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>Show: {booking.venue.showTime}</Text>
          </View>
        )}
      </View>

      <View style={styles.bookingFooter}>
        {booking.checkedIn ? (
          <View style={styles.checkedInBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.checkedInText, { color: colors.success }]}>Checked In</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkInButton, { backgroundColor: colors.primary }]}
            onPress={() => handleCheckIn(booking)}
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.viewMoreButton}>
          <Text style={[styles.viewMoreText, { color: colors.primary }]}>Booking Details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const statusFilters = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const styles = createStyles(colors, isDark);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Error loading bookings</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === item.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: selectedStatus === item.key ? '#fff' : colors.textSecondary },
              ]}>
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Bookings list */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubText}>
                {selectedStatus === 'all' 
                  ? 'Your upcoming bookings will appear here'
                  : `No ${selectedStatus} bookings at the moment`}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Booking Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedBooking && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Header Card */}
              <View style={styles.bookingDetailCard}>
                <View style={styles.bookingDetailHeader}>
                  <Text style={styles.bookingDetailCode}>{selectedBooking.bookingCode}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(selectedBooking.status)} 
                      size={16} 
                      color={getStatusColor(selectedBooking.status)} 
                    />
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedBooking.status) }]}>
                      {selectedBooking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bookingDetailTitle}>{selectedBooking.title || 'Event Title'}</Text>

                {/* Event Details */}
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Event Details</Text>
                </View>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedBooking.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedBooking.eventDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Venue Information */}
              {selectedBooking.venue && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="business" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Venue Information</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Venue Name</Text>
                      <Text style={styles.detailValue}>{selectedBooking.venue.name}</Text>
                      {selectedBooking.venue.address && (
                        <Text style={styles.detailSubValue}>{selectedBooking.venue.address}</Text>
                      )}
                      {selectedBooking.venue.city && (
                        <Text style={styles.detailSubValue}>
                          {selectedBooking.venue.city}, {selectedBooking.venue.country}
                        </Text>
                      )}
                    </View>

                    {selectedBooking.venue.contactPerson && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Venue Contact</Text>
                        <Text style={styles.detailValue}>{selectedBooking.venue.contactPerson}</Text>
                        {selectedBooking.venue.contactPhone && (
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`tel:${selectedBooking.venue?.contactPhone}`)}
                            style={styles.contactButton}
                          >
                            <Text style={[styles.detailSubValue, { color: colors.primary }]}>
                              📞 {selectedBooking.venue.contactPhone}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {selectedBooking.venue.contactEmail && (
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`mailto:${selectedBooking.venue?.contactEmail}`)}
                            style={styles.contactButton}
                          >
                            <Text style={[styles.detailSubValue, { color: colors.primary }]}>
                              ✉️ {selectedBooking.venue.contactEmail}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Schedule Information */}
                    {(selectedBooking.venue.loadInTime || selectedBooking.venue.soundCheckTime || selectedBooking.venue.showTime) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Schedule</Text>
                        {selectedBooking.venue.loadInTime && (
                          <Text style={styles.detailValue}>🚚 Load-in: {selectedBooking.venue.loadInTime}</Text>
                        )}
                        {selectedBooking.venue.soundCheckTime && (
                          <Text style={styles.detailValue}>🎵 Soundcheck: {selectedBooking.venue.soundCheckTime}</Text>
                        )}
                        {selectedBooking.venue.showTime && (
                          <Text style={styles.detailValue}>🎤 Show: {selectedBooking.venue.showTime}</Text>
                        )}
                        {selectedBooking.venue.curfew && (
                          <Text style={styles.detailValue}>⏰ Curfew: {selectedBooking.venue.curfew}</Text>
                        )}
                      </View>
                    )}

                    {/* Facilities */}
                    {(selectedBooking.venue.parkingInfo || selectedBooking.venue.wifiCredentials) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Facilities</Text>
                        {selectedBooking.venue.parkingInfo && (
                          <Text style={styles.detailValue}>🚗 Parking: {selectedBooking.venue.parkingInfo}</Text>
                        )}
                        {selectedBooking.venue.wifiCredentials && (
                          <Text style={styles.detailValue}>📶 WiFi: {selectedBooking.venue.wifiCredentials}</Text>
                        )}
                        {selectedBooking.venue.dressing_room && (
                          <Text style={styles.detailValue}>🚪 Dressing Room: {selectedBooking.venue.dressing_room}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Stage & Technical */}
              {selectedBooking.stage && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="musical-notes" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Stage & Technical</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Stage Information</Text>
                      <Text style={styles.detailValue}>{selectedBooking.stage.name}</Text>
                      <Text style={styles.detailSubValue}>
                        Capacity: {selectedBooking.stage.capacity.toLocaleString()}
                      </Text>
                      {selectedBooking.stage.stageSize && (
                        <Text style={styles.detailSubValue}>Size: {selectedBooking.stage.stageSize}</Text>
                      )}
                    </View>

                    {(selectedBooking.stage.soundSystem || selectedBooking.stage.lighting) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Technical Specs</Text>
                        {selectedBooking.stage.soundSystem && (
                          <Text style={styles.detailValue}>🔊 Sound: {selectedBooking.stage.soundSystem}</Text>
                        )}
                        {selectedBooking.stage.lighting && (
                          <Text style={styles.detailValue}>💡 Lighting: {selectedBooking.stage.lighting}</Text>
                        )}
                        {selectedBooking.stage.acoustics && (
                          <Text style={styles.detailValue}>🎼 Acoustics: {selectedBooking.stage.acoustics}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Financial Information */}
              {selectedBooking.financial && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="card" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Financial Details</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    {selectedBooking.financial.fee && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Performance Fee</Text>
                        <Text style={[styles.detailValue, { color: colors.success, fontSize: 20, fontWeight: 'bold' }]}>
                          {selectedBooking.financial.currency || '$'}{selectedBooking.financial.fee.toLocaleString()}
                        </Text>
                        {selectedBooking.financial.paymentStatus && (
                          <Text style={styles.detailSubValue}>
                            Status: {selectedBooking.financial.paymentStatus}
                          </Text>
                        )}
                        {selectedBooking.financial.paymentDue && (
                          <Text style={styles.detailSubValue}>
                            Due: {selectedBooking.financial.paymentDue}
                          </Text>
                        )}
                      </View>
                    )}

                    {selectedBooking.financial.expenses && selectedBooking.financial.expenses.length > 0 && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Expenses</Text>
                        {selectedBooking.financial.expenses.map((expense, index) => (
                          <Text key={index} style={styles.detailValue}>
                            {expense.type}: {selectedBooking.financial?.currency || '$'}{expense.amount}
                            {expense.description && ` (${expense.description})`}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Contacts */}
              {selectedBooking.contacts && selectedBooking.contacts.length > 0 && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="people" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Key Contacts</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    {selectedBooking.contacts.map((contact, index) => (
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
              {selectedBooking.requirements && selectedBooking.requirements.length > 0 && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="list" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Requirements</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    {selectedBooking.requirements.map((req, index) => (
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
              {selectedBooking.notes && (
                <View style={styles.bookingDetailCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Additional Notes</Text>
                  </View>
                  <Text style={styles.notesText}>{selectedBooking.notes}</Text>
                </View>
              )}

              {/* Contracts */}
              <View style={styles.bookingDetailCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Contracts & Documents</Text>
                </View>
                <Text style={styles.detailValue}>
                  {selectedBooking.contractsCount} contract{selectedBooking.contractsCount !== 1 ? 's' : ''} available
                </Text>
              </View>

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

                {!selectedBooking.checkedIn && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryActionButton]}
                    onPress={() => {
                      handleCheckIn(selectedBooking);
                      setShowDetailModal(false);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.primaryActionButtonText}>Check In</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
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
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.success + '20',
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    marginHorizontal: 40, // Space for close button
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
  bookingDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 26,
    flexWrap: 'wrap',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailContent: {
    marginTop: 4,
    flex: 1,
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
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  primaryActionButtonText: {
    color: '#fff',
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
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
  contactButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 2,
    borderRadius: 4,
  },
});