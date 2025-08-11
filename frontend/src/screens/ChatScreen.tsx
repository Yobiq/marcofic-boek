import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artistService } from '../services/artist';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ChatThread, ChatMessage } from '../types';

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesListRef = useRef<FlatList>(null);

  const {
    data: threads,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: () => artistService.getChatThreads(),
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chat-messages', selectedThread?.id],
    queryFn: () => selectedThread ? artistService.getChatMessages(selectedThread.id) : Promise.resolve({ data: [], hasMore: false }),
    enabled: !!selectedThread,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: number; content: string }) =>
      artistService.sendMessage(threadId, content),
    onSuccess: () => {
      setMessageText('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
      // Scroll to bottom after sending message
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleThreadPress = (thread: ChatThread) => {
    setSelectedThread(thread);
    setShowMessaging(true);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedThread) return;
    
    sendMessageMutation.mutate({
      threadId: selectedThread.id,
      content: messageText.trim(),
    });
  };

  const handleBackToThreads = () => {
    setShowMessaging(false);
    setSelectedThread(null);
    setMessageText('');
  };

  const filteredThreads = threads?.filter(thread =>
    thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatThreadTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderThread = ({ item: thread }: { item: ChatThread }) => (
    <TouchableOpacity
      style={[styles.threadCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleThreadPress(thread)}
      activeOpacity={0.7}
    >
      <View style={styles.threadHeader}>
        <View style={styles.threadInfo}>
          <Text style={[styles.threadName, { color: colors.text }]} numberOfLines={1}>
            {thread.name}
          </Text>
          <View style={styles.participantsBadge}>
            <Ionicons name="people" size={12} color={colors.textSecondary} />
            <Text style={[styles.participantsCount, { color: colors.textSecondary }]}>
              {thread.participants.length}
            </Text>
          </View>
        </View>
        
        <View style={styles.threadMeta}>
          {thread.lastMessageAt && (
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatThreadTime(thread.lastMessageAt)}
            </Text>
          )}
          {thread.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadCount}>{thread.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {thread.lastMessage && (
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {thread.lastMessage}
        </Text>
      )}

      <View style={styles.threadFooter}>
        <View style={styles.participants}>
          {thread.participants.slice(0, 3).map((participant, index) => (
            <View key={participant.id} style={styles.participantChip}>
              <Text style={[styles.participantText, { color: colors.primary }]}>
                {participant.name}
              </Text>
              {participant.role && (
                <Text style={[styles.participantRole, { color: colors.textSecondary }]}>
                  {participant.role}
                </Text>
              )}
            </View>
          ))}
          {thread.participants.length > 3 && (
            <Text style={[styles.moreParticipants, { color: colors.textSecondary }]}>
              +{thread.participants.length - 3} more
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item: message, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = message.user_id === user?.id;
    const messages = messagesData?.data || [];
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !previousMessage || previousMessage.user_id !== message.user_id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && showAvatar && (
          <View style={[styles.messageAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.messageAvatarText}>
              {message.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage 
            ? { backgroundColor: colors.primary } 
            : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }
        ]}>
          {!isOwnMessage && showAvatar && (
            <Text style={[styles.messageSender, { color: colors.textSecondary }]}>
              {message.user.name}
            </Text>
          )}
          
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#fff' : colors.text }
          ]}>
            {message.content}
          </Text>
          
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {formatMessageTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors, isDark);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Error loading chat threads</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Messaging View
  if (showMessaging && selectedThread) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Header */}
        <View style={[styles.messagesHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBackToThreads} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.threadHeaderInfo}>
            <Text style={[styles.threadHeaderName, { color: colors.text }]} numberOfLines={1}>
              {selectedThread.name}
            </Text>
            <Text style={[styles.threadHeaderParticipants, { color: colors.textSecondary }]}>
              {selectedThread.participants.length} participants
            </Text>
          </View>
          
          <TouchableOpacity style={styles.threadOptionsButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={messagesListRef}
          data={messagesData?.data || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => messagesListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            !messagesLoading ? (
              <View style={styles.emptyMessagesContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyMessagesText, { color: colors.textSecondary }]}>
                  No messages yet
                </Text>
                <Text style={[styles.emptyMessagesSubText, { color: colors.textSecondary }]}>
                  Start the conversation!
                </Text>
              </View>
            ) : null
          }
        />

        {/* Message Input */}
        <View style={[styles.messageInputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.messageInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={2000}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: messageText.trim() ? colors.primary : colors.textSecondary }
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Threads List View
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Team Chat</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search conversations..."
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
      </View>

      {/* Threads List */}
      <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderThread}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Your team conversations will appear here'
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  threadCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  threadInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  participantsCount: {
    fontSize: 11,
    marginLeft: 2,
    fontWeight: '500',
  },
  threadMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  threadFooter: {
    marginTop: 8,
  },
  participants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  participantText: {
    fontSize: 12,
    fontWeight: '500',
  },
  participantRole: {
    fontSize: 11,
    marginLeft: 4,
  },
  moreParticipants: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Messaging Styles
  messagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  threadHeaderInfo: {
    flex: 1,
  },
  threadHeaderName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  threadHeaderParticipants: {
    fontSize: 14,
    marginTop: 2,
  },
  threadOptionsButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageSender: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessagesSubText: {
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
});