import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { artistService } from '../services/artist';
import { useTheme } from '../contexts/ThemeContext';
import { ItineraryItem } from '../types';

interface ItineraryScreenProps {
  route?: {
    params?: {
      bookingId?: number;
      tourId?: number;
    };
  };
}

export default function ItineraryScreen({ route }: ItineraryScreenProps) {
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  
  const bookingId = route?.params?.bookingId;
  const tourId = route?.params?.tourId;

  const {
    data: itineraryItems,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['itinerary', bookingId || tourId || 'default', bookingId ? 'booking' : 'tour'],
    queryFn: () => {
      if (bookingId) {
        return artistService.getBookingItinerary(bookingId);
      } else if (tourId) {
        return artistService.getTourItinerary(tourId);
      }
      // Default: fetch first booking's itinerary
      return artistService.getBookingItinerary(5); // Sample booking ID
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCheckIn = async (item: ItineraryItem) => {
    if (item.checked_in) {
      Alert.alert('Already Checked In', 'You have already checked in for this item.');
      return;
    }

    Alert.alert(
      'Check In',
      `Check in for ${item.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            try {
              await artistService.checkInItineraryItem(item.id);
              Alert.alert('Success', 'Checked in successfully!');
              refetch();
            } catch (error) {
              Alert.alert('Error', 'Failed to check in. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleItemPress = (item: ItineraryItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'Check out my tour itinerary!',
        title: 'Tour Itinerary',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const openLocation = (location?: string) => {
    if (location) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
      Linking.openURL(url);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return 'airplane';
      case 'hotel': return 'bed';
      case 'transport': return 'car';
      case 'schedule': return 'calendar';
      default: return 'list';
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'flight': return '#3498db';
      case 'hotel': return '#e74c3c';
      case 'transport': return '#f39c12';
      case 'schedule': return '#9b59b6';
      default: return colors.textSecondary;
    }
  };

  const formatDateTime = (dateTime: string, timezone?: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
  };

  const formatTime = (dateTime: string, timezone?: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
  };

  const filteredItems = useMemo(() => {
    if (!itineraryItems) return [];
    
    let filtered = itineraryItems;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.type === selectedFilter);
    }
    
    return filtered;
  }, [itineraryItems, searchQuery, selectedFilter]);

  const groupItemsByDate = (items: ItineraryItem[]) => {
    const groups: { [key: string]: ItineraryItem[] } = {};
    
    items.forEach(item => {
      const date = new Date(item.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    }));
  };

  const renderTimelineItem = (item: ItineraryItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={styles.timelineItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.timelineContent}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIcon, { backgroundColor: getItemColor(item.type) }]}>
            <Ionicons name={getItemIcon(item.type)} size={16} color="#fff" />
          </View>
          {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
        </View>
        
        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.itemHeader}>
            <View style={styles.itemTypeContainer}>
              <Text style={[styles.itemType, { color: getItemColor(item.type) }]}>
                {item.type.toUpperCase()}
              </Text>
              <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                {formatTime(item.start_time, item.timezone)}
                {item.end_time && ` - ${formatTime(item.end_time, item.timezone)}`}
              </Text>
            </View>
            
            {item.checked_in ? (
              <View style={[styles.checkedInBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.checkedInText, { color: colors.success }]}>Checked In</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.checkInButton, { backgroundColor: colors.primary }]}
                onPress={() => handleCheckIn(item)}
              >
                <Text style={styles.checkInButtonText}>Check In</Text>
              </TouchableOpacity>
            )}
          </View>

          {item.location && (
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={() => openLocation(item.location)}
            >
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={[styles.itemLocation, { color: colors.text }]}>{item.location}</Text>
              <Ionicons name="open" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {item.notes && (
            <Text style={[styles.itemNotes, { color: colors.textSecondary }]}>{item.notes}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: ItineraryItem }) => (
    <TouchableOpacity
      style={[styles.listItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <View style={[styles.listItemIcon, { backgroundColor: getItemColor(item.type) + '20' }]}>
          <Ionicons name={getItemIcon(item.type)} size={24} color={getItemColor(item.type)} />
        </View>
        
        <View style={styles.listItemDetails}>
          <View style={styles.listItemHeader}>
            <Text style={[styles.listItemType, { color: colors.text }]}>{item.type.toUpperCase()}</Text>
            <Text style={[styles.listItemTime, { color: colors.textSecondary }]}>
              {formatTime(item.start_time, item.timezone)}
            </Text>
          </View>
          
          {item.location && (
            <Text style={[styles.listItemLocation, { color: colors.textSecondary }]}>
              {item.location}
            </Text>
          )}
          
          {item.notes && (
            <Text style={[styles.listItemNotes, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
        </View>
        
        <View style={styles.listItemActions}>
          {item.checked_in ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          ) : (
            <TouchableOpacity
              style={[styles.listCheckInButton, { backgroundColor: colors.primary }]}
              onPress={() => handleCheckIn(item)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const typeFilters = [
    { key: 'all', label: 'All', count: filteredItems.length },
    { key: 'flight', label: 'Flights', count: filteredItems.filter(i => i.type === 'flight').length },
    { key: 'hotel', label: 'Hotels', count: filteredItems.filter(i => i.type === 'hotel').length },
    { key: 'transport', label: 'Transport', count: filteredItems.filter(i => i.type === 'transport').length },
    { key: 'schedule', label: 'Schedule', count: filteredItems.filter(i => i.type === 'schedule').length },
  ];

  const styles = createStyles(colors, isDark);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Error loading itinerary</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groupedItems = groupItemsByDate(filteredItems);

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search itinerary..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'timeline' && { backgroundColor: colors.primary + '20' }]}
            onPress={() => setViewMode('timeline')}
          >
            <Ionicons name="git-network" size={20} color={viewMode === 'timeline' ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'list' && { backgroundColor: colors.primary + '20' }]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Type Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {typeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: selectedFilter === filter.key ? '#fff' : colors.textSecondary },
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {viewMode === 'timeline' ? (
        <ScrollView
          style={styles.timelineContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {groupedItems.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: colors.text }]}>{group.date}</Text>
              <View style={styles.timelineGroup}>
                {group.items.map((item, index) => 
                  renderTimelineItem(item, index === group.items.length - 1)
                )}
              </View>
            </View>
          ))}
          
          {filteredItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No itinerary items found</Text>
              {searchQuery && (
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  Try adjusting your search or filters
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderListItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No itinerary items found</Text>
              {searchQuery && (
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  Try adjusting your search or filters
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Itinerary Details</Text>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
                <View style={styles.detailHeader}>
                  <View style={[styles.detailIcon, { backgroundColor: getItemColor(selectedItem.type) }]}>
                    <Ionicons name={getItemIcon(selectedItem.type)} size={24} color="#fff" />
                  </View>
                  <View style={styles.detailHeaderText}>
                    <Text style={[styles.detailType, { color: colors.text }]}>
                      {selectedItem.type.toUpperCase()}
                    </Text>
                    <Text style={[styles.detailTime, { color: colors.textSecondary }]}>
                      {formatDateTime(selectedItem.start_time, selectedItem.timezone)}
                      {selectedItem.end_time && ` - ${formatDateTime(selectedItem.end_time, selectedItem.timezone)}`}
                    </Text>
                  </View>
                </View>

                {selectedItem.location && (
                  <TouchableOpacity 
                    style={styles.detailLocation}
                    onPress={() => openLocation(selectedItem.location)}
                  >
                    <Ionicons name="location" size={20} color={colors.textSecondary} />
                    <Text style={[styles.detailLocationText, { color: colors.text }]}>
                      {selectedItem.location}
                    </Text>
                    <Ionicons name="open" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {selectedItem.notes && (
                  <View style={styles.detailNotes}>
                    <Text style={[styles.detailNotesLabel, { color: colors.textSecondary }]}>Notes</Text>
                    <Text style={[styles.detailNotesText, { color: colors.text }]}>
                      {selectedItem.notes}
                    </Text>
                  </View>
                )}

                {/* Type-specific content */}
                {selectedItem.content && (
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailContentLabel, { color: colors.textSecondary }]}>Details</Text>
                    {Object.entries(selectedItem.content).map(([key, value]) => (
                      <View key={key} style={styles.detailContentItem}>
                        <Text style={[styles.detailContentKey, { color: colors.textSecondary }]}>
                          {key.replace(/_/g, ' ').toUpperCase()}:
                        </Text>
                        <Text style={[styles.detailContentValue, { color: colors.text }]}>
                          {String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.detailActions}>
                  {selectedItem.checked_in ? (
                    <View style={[styles.checkedInStatus, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={[styles.checkedInStatusText, { color: colors.success }]}>
                        Checked In
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.detailCheckInButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        handleCheckIn(selectedItem);
                        setShowDetailModal(false);
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.detailCheckInButtonText}>Check In</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  shareButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timelineContainer: {
    flex: 1,
    padding: 16,
  },
  dateGroup: {
    marginBottom: 32,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timelineGroup: {
    paddingLeft: 8,
  },
  timelineItem: {
    marginBottom: 16,
  },
  timelineContent: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTypeContainer: {
    flex: 1,
  },
  itemType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 14,
  },
  checkInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLocation: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  itemNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  listItemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemDetails: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemTime: {
    fontSize: 14,
  },
  listItemLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  listItemNotes: {
    fontSize: 13,
    lineHeight: 18,
  },
  listItemActions: {
    alignItems: 'center',
  },
  listCheckInButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    borderRadius: 16,
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailType: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailTime: {
    fontSize: 16,
  },
  detailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  detailLocationText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  detailNotes: {
    marginBottom: 20,
  },
  detailNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailNotesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailContent: {
    marginBottom: 20,
  },
  detailContentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detailContentItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailContentKey: {
    fontSize: 14,
    width: 120,
  },
  detailContentValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  detailActions: {
    alignItems: 'center',
  },
  detailCheckInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  detailCheckInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  checkedInStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkedInStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});