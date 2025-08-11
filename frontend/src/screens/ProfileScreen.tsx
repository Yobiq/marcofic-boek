import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  ActionSheetIOS,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artistService } from '../services/artist';
import { authService } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  name: string;
  bio: string;
  genres: string[];
  socialMedia: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    soundcloud?: string;
    website?: string;
  };
  contact: {
    phone?: string;
    bookingEmail?: string;
    location?: string;
  };
  equipment: string[];
  experience: string;
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    bio: '',
    genres: [],
    socialMedia: {},
    contact: {},
    equipment: [],
    experience: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newGenre, setNewGenre] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => artistService.getProfile(),
    onSuccess: (data) => {
      setFormData({
        name: data?.name || '',
        bio: data?.bio || '',
        genres: data?.genres || ['Electronic', 'House', 'Techno'],
        socialMedia: data?.socialMedia || {},
        contact: data?.contact || {},
        equipment: data?.equipment || ['CDJ-2000NXS2', 'DJM-900NXS2', 'Pioneer Headphones'],
        experience: data?.experience || '5+ years of professional DJing',
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ProfileData>) => artistService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsEditing(false);
      setActiveSection(null);
      setSelectedImage(null);
      Alert.alert('Success', 'Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (imageUri: string) => artistService.uploadAvatar(imageUri),
    onSuccess: (response) => {
      console.log('Upload success response:', response);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSelectedImage(null); // Clear selected image after successful upload
      Alert.alert('Success', 'Profile picture updated successfully!');
    },
    onError: (error: any) => {
      console.error('Image upload error:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.response?.status === 413) {
        errorMessage = 'Image file is too large. Please select a smaller image (max 2MB).';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid image format. Please select a JPEG, PNG, or GIF image.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    },
  });

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photos to upload a profile picture.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async (source: 'library' | 'camera') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        setSelectedImage(imageUri);
        
        // Show loading feedback
        Alert.alert('Uploading', 'Please wait while we upload your profile picture...');
        
        try {
          uploadImageMutation.mutate(imageUri);
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Upload Failed', 'Failed to start upload. Please try again.');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage('camera');
          } else if (buttonIndex === 2) {
            pickImage('library');
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose how you want to select your profile picture',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Library', onPress: () => pickImage('library') },
        ]
      );
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      bio: profile?.bio || '',
      genres: profile?.genres || ['Electronic', 'House', 'Techno'],
      socialMedia: profile?.socialMedia || {},
      contact: profile?.contact || {},
      equipment: profile?.equipment || ['CDJ-2000NXS2', 'DJM-900NXS2', 'Pioneer Headphones'],
      experience: profile?.experience || '5+ years of professional DJing',
    });
    setSelectedImage(null);
    setIsEditing(false);
    setActiveSection(null);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const addGenre = () => {
    if (newGenre.trim() && !formData.genres.includes(newGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, newGenre.trim()]
      }));
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipment.includes(newEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(e => e !== equipment)
    }));
  };

  const openSocialMedia = (platform: string, url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const avatarSource = selectedImage || profile?.avatar || user?.artist?.avatar;
  const styles = createStyles(colors, isDark);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Error loading profile</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={showImagePicker} activeOpacity={0.7}>
            <View style={styles.avatarWrapper}>
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(formData.name || user?.name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
              
              {uploadImageMutation.isPending && (
                <View style={styles.uploadingOverlay}>
                  <View style={styles.uploadingContent}>
                    <Ionicons name="cloud-upload" size={24} color="#fff" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          {isEditing && activeSection === 'basic' ? (
            <TextInput
              style={styles.nameInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Your name"
              maxLength={50}
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <Text style={styles.profileName}>
              {formData.name || user?.name || 'No name'}
            </Text>
          )}
          
          <Text style={styles.profileEmail}>
            {profile?.email || user?.email || 'No email'}
          </Text>
          
          <View style={styles.genreContainer}>
            {formData.genres.slice(0, 3).map((genre, index) => (
              <View key={index} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>

        {!isEditing && (
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              setIsEditing(true);
              setActiveSection('basic');
            }}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Performance Stats</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>47</Text>
            <Text style={styles.statLabel}>Total Shows</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>About</Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setActiveSection('bio');
              }}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {isEditing && activeSection === 'bio' ? (
          <TextInput
            style={styles.bioInput}
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        ) : (
          <Text style={styles.bioText}>
            {formData.bio || user?.artist?.bio || 'Professional DJ with over 5 years of experience in electronic music. Specializing in house, techno, and progressive sounds.'}
          </Text>
        )}
      </View>

      {/* Music Genres */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="musical-notes" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Music Genres</Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setActiveSection('genres');
              }}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.chipContainer}>
          {formData.genres.map((genre, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText}>{genre}</Text>
              {isEditing && activeSection === 'genres' && (
                <TouchableOpacity onPress={() => removeGenre(genre)}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        
        {isEditing && activeSection === 'genres' && (
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              value={newGenre}
              onChangeText={setNewGenre}
              placeholder="Add genre..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={addGenre} style={styles.addButton}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Social Media */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="share-social" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Social Media</Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setActiveSection('social');
              }}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {isEditing && activeSection === 'social' ? (
          <View style={styles.socialInputContainer}>
            <View style={styles.socialInputRow}>
              <Ionicons name="logo-instagram" size={20} color="#E4405F" />
              <TextInput
                style={styles.socialInput}
                value={formData.socialMedia.instagram || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, instagram: text }
                }))}
                placeholder="Instagram username"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.socialInputRow}>
              <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
              <TextInput
                style={styles.socialInput}
                value={formData.socialMedia.twitter || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, twitter: text }
                }))}
                placeholder="Twitter handle"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.socialInputRow}>
              <Ionicons name="musical-note" size={20} color="#1ED760" />
              <TextInput
                style={styles.socialInput}
                value={formData.socialMedia.spotify || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, spotify: text }
                }))}
                placeholder="Spotify artist URL"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.socialInputRow}>
              <Ionicons name="cloud" size={20} color="#FF5500" />
              <TextInput
                style={styles.socialInput}
                value={formData.socialMedia.soundcloud || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, soundcloud: text }
                }))}
                placeholder="SoundCloud profile"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        ) : (
          <View style={styles.socialLinksContainer}>
            {formData.socialMedia.instagram && (
              <TouchableOpacity 
                style={styles.socialLink}
                onPress={() => openSocialMedia('instagram', `https://instagram.com/${formData.socialMedia.instagram}`)}
              >
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                <Text style={styles.socialLinkText}>@{formData.socialMedia.instagram}</Text>
              </TouchableOpacity>
            )}
            
            {formData.socialMedia.twitter && (
              <TouchableOpacity 
                style={styles.socialLink}
                onPress={() => openSocialMedia('twitter', `https://twitter.com/${formData.socialMedia.twitter}`)}
              >
                <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                <Text style={styles.socialLinkText}>@{formData.socialMedia.twitter}</Text>
              </TouchableOpacity>
            )}
            
            {formData.socialMedia.spotify && (
              <TouchableOpacity 
                style={styles.socialLink}
                onPress={() => openSocialMedia('spotify', formData.socialMedia.spotify)}
              >
                <Ionicons name="musical-note" size={24} color="#1ED760" />
                <Text style={styles.socialLinkText}>Spotify</Text>
              </TouchableOpacity>
            )}
            
            {formData.socialMedia.soundcloud && (
              <TouchableOpacity 
                style={styles.socialLink}
                onPress={() => openSocialMedia('soundcloud', formData.socialMedia.soundcloud)}
              >
                <Ionicons name="cloud" size={24} color="#FF5500" />
                <Text style={styles.socialLinkText}>SoundCloud</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Equipment */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hardware-chip" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Equipment</Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setActiveSection('equipment');
              }}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.equipmentList}>
          {formData.equipment.map((item, index) => (
            <View key={index} style={styles.equipmentItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.equipmentText}>{item}</Text>
              {isEditing && activeSection === 'equipment' && (
                <TouchableOpacity onPress={() => removeEquipment(item)}>
                  <Ionicons name="close" size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        
        {isEditing && activeSection === 'equipment' && (
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              value={newEquipment}
              onChangeText={setNewEquipment}
              placeholder="Add equipment..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={addEquipment} style={styles.addButton}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setActiveSection('contact');
              }}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {isEditing && activeSection === 'contact' ? (
          <View style={styles.contactInputContainer}>
            <View style={styles.contactInputRow}>
              <Ionicons name="call" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.contactInput}
                value={formData.contact.phone || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, phone: text }
                }))}
                placeholder="Phone number"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.contactInputRow}>
              <Ionicons name="mail" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.contactInput}
                value={formData.contact.bookingEmail || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, bookingEmail: text }
                }))}
                placeholder="Booking email"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.contactInputRow}>
              <Ionicons name="location" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.contactInput}
                value={formData.contact.location || ''}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, location: text }
                }))}
                placeholder="Location"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        ) : (
          <View style={styles.contactInfoContainer}>
            {formData.contact.phone && (
              <View style={styles.contactInfoItem}>
                <Ionicons name="call" size={20} color={colors.textSecondary} />
                <Text style={styles.contactInfoText}>{formData.contact.phone}</Text>
              </View>
            )}
            
            {formData.contact.bookingEmail && (
              <View style={styles.contactInfoItem}>
                <Ionicons name="mail" size={20} color={colors.textSecondary} />
                <Text style={styles.contactInfoText}>{formData.contact.bookingEmail}</Text>
              </View>
            )}
            
            {formData.contact.location && (
              <View style={styles.contactInfoItem}>
                <Ionicons name="location" size={20} color={colors.textSecondary} />
                <Text style={styles.contactInfoText}>{formData.contact.location}</Text>
              </View>
            )}
            
            {!formData.contact.phone && !formData.contact.bookingEmail && !formData.contact.location && (
              <Text style={styles.emptyStateText}>No contact information added yet</Text>
            )}
          </View>
        )}
      </View>

      {/* Edit Actions */}
      {isEditing && (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}
          >
            <Text style={styles.saveButtonText}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}



      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>OnTourly Artist App v1.0.0</Text>
        <Text style={styles.appInfoSubText}>Made with ❤️ for artists</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    backgroundColor: colors.surface,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    textAlign: 'center',
    minWidth: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  genreChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  genreText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bioText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  bioInput: {
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: colors.background,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 4,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInputContainer: {
    gap: 12,
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.background,
  },
  socialLinksContainer: {
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialLinkText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  equipmentList: {
    gap: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipmentText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  contactInputContainer: {
    gap: 12,
  },
  contactInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.background,
  },
  contactInfoContainer: {
    gap: 12,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInfoText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 30,
  },
  appInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  appInfoSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
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