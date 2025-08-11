import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useTheme } from './src/contexts/ThemeContext';

// Screens
import CalendarScreen from './src/screens/CalendarScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ItineraryScreen from './src/screens/ItineraryScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';

const Drawer = createDrawerNavigator();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Custom Drawer Content
function CustomDrawerContent({ navigation }: any) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: 'Calendar',
      title: 'Calendar',
      subtitle: 'Upcoming events & performances',
      icon: 'calendar-outline',
      badge: '12'
    },
    {
      name: 'Bookings',
      title: 'Bookings',
      subtitle: 'Manage your contracts',
      icon: 'list-outline',
      badge: '8'
    },
    {
      name: 'Itinerary',
      title: 'Itinerary',
      subtitle: 'Travel & schedule details',
      icon: 'map-outline',
      badge: '3'
    },
    {
      name: 'Chat',
      title: 'Chat & Contacts',
      subtitle: 'Team communication',
      icon: 'chatbubbles-outline',
      badge: '5'
    },
    {
      name: 'Notifications',
      title: 'Notifications',
      subtitle: 'Updates & alerts',
      icon: 'notifications-outline',
      badge: '15'
    },
    {
      name: 'Profile',
      title: 'Profile',
      subtitle: 'Artist information',
      icon: 'person-outline'
    },
    {
      name: 'Settings',
      title: 'Settings',
      subtitle: 'App preferences',
      icon: 'settings-outline'
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const styles = createDrawerStyles(colors);

  return (
    <View style={styles.drawerContainer}>
      {/* Profile Header - Centered */}
      <View style={styles.profileSection}>
        {user?.artist?.avatar ? (
          <Image source={{ uri: user.artist.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'J'}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Jane Doe'}</Text>
          <Text style={styles.profileSubtitle}>
            {user?.artist?.bio || 'Electronic Artist'}
          </Text>
          
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate(item.name);
              navigation.closeDrawer();
            }}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} style={styles.menuIcon} />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.error }]}>Logout</Text>
              <Text style={styles.menuSubtitle}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Main App Component
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <Ionicons name="musical-notes" size={48} color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <NavigationContainer>
          <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={({ navigation }) => ({
              headerStyle: {
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              drawerStyle: {
                backgroundColor: colors.surface,
                width: 320,
              },
              swipeEnabled: true,
              gestureEnabled: true,
              headerLeft: () => (
                <TouchableOpacity 
                  onPress={() => navigation.openDrawer()} 
                  style={{ 
                    marginLeft: 15,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: colors.background,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="menu" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            })}
          >
            <Drawer.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
            <Drawer.Screen name="Bookings" component={BookingsScreen} options={{ title: 'Bookings' }} />
            <Drawer.Screen name="Itinerary" component={ItineraryScreen} options={{ title: 'Itinerary' }} />
            <Drawer.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat & Contacts' }} />
            <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          </Drawer.Navigator>
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const createDrawerStyles = (colors: any) => StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  profileSection: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },

  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
