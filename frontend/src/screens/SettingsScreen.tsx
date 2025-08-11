import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { user, logout } = useAuth();

  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const styles = createStyles(colors, isDark);

  const settingSections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: 'color-palette-outline',
          title: 'Theme',
          subtitle: 'Choose your preferred theme',
          type: 'theme-selector',
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          subtitle: 'Receive updates and alerts',
          type: 'toggle',
          value: true,
        },
        {
          icon: 'chatbubbles-outline',
          title: 'Chat Messages',
          subtitle: 'Get notified of new messages',
          type: 'toggle',
          value: true,
        },
        {
          icon: 'calendar-outline',
          title: 'Booking Updates',
          subtitle: 'Schedule and contract changes',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Policy',
          subtitle: 'View our privacy policy',
          type: 'navigation',
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          subtitle: 'Read terms and conditions',
          type: 'navigation',
        },
        {
          icon: 'lock-closed-outline',
          title: 'Change Password',
          subtitle: 'Update your account password',
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help Center',
          subtitle: 'Get help and support',
          type: 'navigation',
        },
        {
          icon: 'mail-outline',
          title: 'Contact Support',
          subtitle: 'Send us feedback or report issues',
          type: 'navigation',
        },
        {
          icon: 'information-circle-outline',
          title: 'About',
          subtitle: 'App version and information',
          type: 'navigation',
        },
      ],
    },
  ];

  const renderThemeSelector = () => (
    <View style={styles.themeSelector}>
      <TouchableOpacity
        style={[
          styles.themeOption,
          theme === 'light' && styles.themeOptionSelected,
        ]}
        onPress={() => handleThemeChange('light')}
      >
        <Ionicons name="sunny" size={24} color={colors.text} />
        <Text style={styles.themeOptionText}>Light</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.themeOption,
          theme === 'dark' && styles.themeOptionSelected,
        ]}
        onPress={() => handleThemeChange('dark')}
      >
        <Ionicons name="moon" size={24} color={colors.text} />
        <Text style={styles.themeOptionText}>Dark</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.themeOption,
          theme === 'system' && styles.themeOptionSelected,
        ]}
        onPress={() => handleThemeChange('system')}
      >
        <Ionicons name="phone-portrait" size={24} color={colors.text} />
        <Text style={styles.themeOptionText}>System</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'theme-selector':
        return (
          <View key={item.title} style={styles.settingItem}>
            <View style={styles.settingItemHeader}>
              <Ionicons name={item.icon} size={24} color={colors.textSecondary} />
              <View style={styles.settingItemText}>
                <Text style={styles.settingItemTitle}>{item.title}</Text>
                <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            {renderThemeSelector()}
          </View>
        );

      case 'toggle':
        return (
          <TouchableOpacity key={item.title} style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name={item.icon} size={24} color={colors.textSecondary} />
              <View style={styles.settingItemText}>
                <Text style={styles.settingItemTitle}>{item.title}</Text>
                <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </TouchableOpacity>
        );

      case 'navigation':
        return (
          <TouchableOpacity key={item.title} style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name={item.icon} size={24} color={colors.textSecondary} />
              <View style={styles.settingItemText}>
                <Text style={styles.settingItemTitle}>{item.title}</Text>
                <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {user?.name?.charAt(0) || 'J'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Jane Doe'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'jane@example.com'}</Text>
        </View>
      </View>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map(renderSettingItem)}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>OnTourly Artist v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    flex: 1,
    marginLeft: 16,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});