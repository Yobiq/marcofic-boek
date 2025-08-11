import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artistService } from '../services/artist';
import { Notification } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();

  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => artistService.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: number[]) => artistService.markNotificationsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read_at) {
      markReadMutation.mutate([notification.id]);
    }
    
    // Handle deep linking based on notification type
    console.log('Handle notification:', notification.type, notification.data);
  };

  const markAllAsRead = () => {
    const unreadIds = safeNotifications
      .filter(n => n && !n.read_at)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      markReadMutation.mutate(unreadIds);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking.updated': return 'calendar-outline';
      case 'itinerary.updated': return 'map-outline';
      case 'chat.message': return 'chatbubble-outline';
      case 'contract.signed': return 'document-text-outline';
      case 'payment.received': return 'card-outline';
      case 'team.invitation': return 'people-outline';
      case 'system.update': return 'settings-outline';
      default: return 'notifications-outline';
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

  const renderNotification = ({ item: notification }: { item: Notification }) => {
    const iconColor = getNotificationColor(notification.type);
    const styles = createStyles(colors, isDark);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !notification.read_at && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(notification)}
      >
        <View style={styles.notificationHeader}>
          <View style={[styles.notificationIcon, { backgroundColor: iconColor + '15' }]}>
            <Ionicons 
              name={getNotificationIcon(notification.type) as any} 
              size={24} 
              color={iconColor} 
            />
          </View>
          
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle,
              !notification.read_at && styles.unreadTitle,
            ]}>
              {notification.title}
            </Text>
            
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {notification.message}
            </Text>
            
            <Text style={styles.notificationTime}>
              {new Date(notification.created_at).toLocaleString()}
            </Text>
          </View>

          {!notification.read_at && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Filter notifications safely
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => n && !n.read_at).length;
  const filteredNotifications = filter === 'all' 
    ? safeNotifications 
    : safeNotifications.filter(n => n && !n.read_at);

  const styles = createStyles(colors, isDark);

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Error loading notifications</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({safeNotifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header with mark all as read */}
      {unreadCount > 0 && filter === 'all' && (
        <View style={styles.headerContainer}>
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
            disabled={markReadMutation.isPending}
          >
            {markReadMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.markAllButtonText}>Mark all as read</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || isLoading} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="notifications-outline" 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyText}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter === 'unread' 
                  ? 'All caught up! Check back later for updates.' 
                  : 'You\'ll see notifications about bookings, messages, and updates here.'
                }
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: colors.primary,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
    minWidth: 100,
    alignItems: 'center',
  },
  markAllButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadNotification: {
    backgroundColor: colors.primary + '08',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
