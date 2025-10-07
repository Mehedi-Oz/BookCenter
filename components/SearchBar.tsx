import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onCameraPress?: () => void;
  onVoicePress?: () => void;
  placeholder?: string;
  showActions?: boolean;
  // Optional width for the search input container (number in px or percentage string like '90%')
  barWidth?: number | string;
  // Make the search container expand to fill the row (useful when icons are present)
  fullWidth?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onCameraPress,
  onVoicePress,
  placeholder = "Search books, authors, publishers...",
  showActions = true,
  barWidth,
  fullWidth,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();
  // On Android, long placeholders can wrap; truncate more aggressively when action icons are shown
  const hasActions = !!(showActions && (onCameraPress || onVoicePress));
  const androidMax = hasActions ? 26 : 34; // tighter when camera/mic buttons reduce input width
  const finalPlaceholder = Platform.select({
    android: placeholder.length > androidMax ? `${placeholder.slice(0, androidMax - 1).trim()}…` : placeholder,
    default: placeholder,
  });

  const clearSearch = () => {
    onChangeText('');
  };

  return (
    <View style={styles.wrapper}>
      <View style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: isFocused ? colors.primary : colors.border },
        isFocused && styles.containerFocused,
        // Let the input container flex to available space without forcing full width
        { flex: 1, minWidth: 0 },
        barWidth != null ? ({ width: barWidth } as any) : null,
      ]}>
        <View style={styles.searchIcon}>
          <Feather name="search" size={20} color={colors.textSecondary} />
        </View>

        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={finalPlaceholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling={false}
          multiline={false}
        />
      </View>

      {/* Removed inline clear button to avoid visual clutter and alignment issues */}

      {showActions && (onCameraPress || onVoicePress) && (
        <View style={styles.actions}>
          {onCameraPress && (
            <Pressable
              onPress={onCameraPress}
              style={({ hovered }) => [
                styles.actionButton,
                styles.cameraButton,
                { backgroundColor: hovered ? '#B8CCA0' : colors.background },
              ]}
            >
              {({ hovered }) => (
                <Feather name="camera" size={18} color={hovered ? '#FFFFFF' : colors.primary} />
              )}
            </Pressable>
          )}

          {onVoicePress && (
            <Pressable
              onPress={onVoicePress}
              style={({ hovered }) => [
                styles.actionButton,
                styles.voiceButton,
                { backgroundColor: hovered ? '#B8CCA0' : colors.background },
              ]}
            >
              {({ hovered }) => (
                <Feather name="mic" size={18} color={hovered ? '#FFFFFF' : colors.primary} />
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    // Make wrapper take full width to prevent unexpected shrink
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 0 : 10,
    height: 48,
  },
  containerFocused: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    // Let input fill within the fixed container without growing it
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
    height: 48,
    textAlignVertical: 'center',
    // Keep placeholder rendering single-line and vertically centered on Android
    lineHeight: Platform.OS === 'android' ? 22 : undefined,
    includeFontPadding: Platform.OS === 'android' ? false : (undefined as any),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    // Space between the search field and first icon
    marginLeft: 0,
    // Prevent icons from shrinking so the input flexes instead
    flexShrink: 0,
  },
  actionButton: {
    // Match search bar height for visual alignment
    height: 48,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    // Space between action buttons
    marginLeft: 8,
  },
  cameraButton: {
    // Special styling for camera button to make it more prominent
    borderWidth: 1,
    borderColor: '#D4C5A1', // Warm taupe border
  },
  voiceButton: {
    // Special styling for voice button to match camera button
    borderWidth: 1,
    borderColor: '#D4C5A1', // Warm taupe border
  },
});