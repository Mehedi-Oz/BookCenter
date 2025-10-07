import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

interface SettingItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
  disabled: boolean;
  isDestructive?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const { stats, books, clearAllData } = useBookStore();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { lockApp, resetAuth } = useAuth();
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [showFinalEmpty, setShowFinalEmpty] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debug logging
  console.log('Settings Screen - Theme Mode:', themeMode);
  console.log('Settings Screen - Is Dark:', isDark);
  console.log('Settings Screen - Colors:', colors);

  const handleThemeChange = () => {
    console.log('Theme change button pressed'); // Debug log
    console.log('Current theme mode:', themeMode); // Debug log

    // Simple toggle between light and dark
    const newMode = themeMode === 'light' ? 'dark' : 'light';

    console.log('Switching to theme:', newMode);
    setThemeMode(newMode);
  };

  const getThemeDisplayName = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'Light';
    }
  };



  const handleImportData = () => {
    router.push('/(tabs)/import');
  };

  const handleBackupDatabase = () => {
    setShowExportConfirm(true);
  };

  const performExport = async () => {
    try {
      setIsExporting(true);
      // Prepare CSV with BOM for Bangla/Excel compatibility
      const csvHeader = 'Serial,Book Name,Author,Publisher,Description,Price\n';
      const csvData = books.map((book: any, index: number) => {
        const serial = index + 1;
        const name = `"${(book.name || '').replace(/"/g, '""')}"`;
        const author = `"${(book.author || '').replace(/"/g, '""')}"`;
        const publisher = `"${(book.publisher || '').replace(/"/g, '""')}"`;
        const description = `"${(book.notes || '').replace(/"/g, '""')}"`;
        const price = book.price || 0;
        return `${serial},${name},${author},${publisher},${description},${price}`;
      }).join('\n');

      const contentRaw = csvHeader + csvData;
      const fullCsvContent = '\ufeff' + contentRaw; // UTF-8 BOM

      const Sharing = require('expo-sharing');
      const FileSystem = require('expo-file-system');

      const fileName = `bookcenter_backup_${new Date().toISOString().split('T')[0]}.csv`;

      // Try Android Storage Access Framework to let user pick a folder
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        try {
          const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (perm.granted) {
            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
              perm.directoryUri,
              fileName,
              'text/csv'
            );
            await FileSystem.writeAsStringAsync(uri, fullCsvContent, { encoding: FileSystem.EncodingType.UTF8 });
            setShowExportConfirm(false);
            Alert.alert('Success', 'CSV downloaded to the selected folder.');
            return;
          }
        } catch (e) {
          console.warn('SAF save failed, falling back to share:', e);
        }
      }

      // Fallback: save to app docs and open share sheet
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, fullCsvContent, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Books CSV' });
      } else {
        Alert.alert('Saved', `CSV saved to app files:\n${fileUri}`);
      }

      setShowExportConfirm(false);
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Error', 'Failed to create backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    setShowConfirmEmpty(true);
  };

  const performClearData = async () => {
    try {
      setIsClearing(true);
      await clearAllData();
      await resetAuth();
      setIsClearing(false);
      setShowFinalEmpty(false);
      setShowConfirmEmpty(false);
      Alert.alert('Success', 'Database emptied successfully.');
    } catch (error) {
      setIsClearing(false);
      console.error('Clear data error:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  const settingSections: SettingSection[] = [
    {
      title: 'Appearance',
      items: [
        {
          icon: 'moon',
          title: 'Theme',
          subtitle: `Current: ${getThemeDisplayName(themeMode)} (tap to toggle)`,
          onPress: handleThemeChange,
          color: colors.secondary,
          disabled: false,
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          icon: 'upload',
          title: 'Import Books',
          subtitle: 'Import from CSV file',
          onPress: handleImportData,
          color: colors.accent,
          disabled: false,
        },
        {
          icon: 'database',
          title: 'Download Database',
          subtitle: 'Export all books as CSV',
          onPress: handleBackupDatabase,
          color: colors.info,
          disabled: false,
        },
        {
          icon: 'lock',
          title: 'Lock App',
          subtitle: 'Require password next time you open the app',
          onPress: async () => {
            await lockApp();
            Alert.alert('Locked', 'The app will ask for password on next open.');
          },
          color: colors.secondary,
          disabled: false,
        },
        {
          icon: 'trash-2',
          title: 'Empty Database',
          subtitle: 'Delete all books, orders, notes, and reminders',
          onPress: handleClearData,
          color: colors.error,
          disabled: false,
          isDestructive: true,
        },
      ],
    },
    {
      title: 'App Information',
      items: [
        {
          icon: 'info',
          title: 'App Version',
          subtitle: '1.0.0',
          onPress: () => { },
          color: colors.textSecondary,
          disabled: true,
        },
        {
          icon: 'life-buoy',
          title: 'Support',
          subtitle: 'Get help and updates on GitHub',
          onPress: () => {
            try {
              const Linking = require('react-native').Linking;
              Linking.openURL('https://github.com/Mehedi-Oz');
            } catch (e) {
              console.error('Failed to open Support link:', e);
            }
          },
          color: colors.secondary,
          disabled: false,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.gradientHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.pageTitle, { fontSize: 26, fontWeight: 'bold', color: '#4A5D3F' }]}>Settings</Text>
      </View>

      <ScrollView>

        {/* Spacer to align content start with pages that have a search bar */}
        <View style={{ height: 16 }} />

        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.sectionGroup}>
            <Text style={[styles.sectionTitle, { color: '#4A5D3F' }]}>{section.title}</Text>

            {section.items.map((item, itemIndex) => (
              <Pressable
                key={itemIndex}
                onPress={item.onPress}
                disabled={item.disabled || false}
                style={({ hovered }) => ([
                  styles.actionCard,
                  { backgroundColor: hovered ? (item.isDestructive ? '#FAD4D4' : '#B8CCA0') : colors.surface },
                  item.disabled && styles.disabledItem,
                ])}
              >
                {({ hovered }) => (
                  <>
                    <View style={[styles.actionIcon, { backgroundColor: '#4A5D3F26' }]}>
                      <Feather
                        name={item.icon}
                        size={20}
                        color={hovered ? (item.isDestructive ? colors.error : '#FFFFFF') : item.color}
                      />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={[
                        styles.actionTitle,
                        { color: hovered ? (item.isDestructive ? colors.error : '#FFFFFF') : (item.isDestructive ? colors.error : '#4A5D3F') },
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.actionSubtitle,
                        { color: hovered ? (item.isDestructive ? colors.error : '#FFFFFF') : (item.isDestructive ? colors.error : colors.textSecondary) },
                      ]}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={hovered ? (item.isDestructive ? colors.error : '#FFFFFF') : (item.isDestructive ? colors.error : colors.textSecondary)}
                    />
                  </>
                )}
              </Pressable>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            © Book Center, Thakurgaon Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Export confirmation modal */}
      <Modal visible={showExportConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#E3F2FD' }]}>
              <Feather name="download" size={24} color={colors.info} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Export Books CSV?</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>Download all books to a CSV file. UTF-8 with BOM for Bangla/Excel compatibility.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setShowExportConfirm(false)} disabled={isExporting}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{isExporting ? 'Please wait…' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.info }]} onPress={performExport} disabled={isExporting}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{isExporting ? 'Downloading…' : 'Download'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Empty Database Modal */}
      <Modal visible={showConfirmEmpty} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#FDECEA' }]}>
              <Feather name="alert-triangle" size={24} color="#B71C1C" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Empty Database?</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>This will permanently delete all books, orders, notes, and reminders. This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setShowConfirmEmpty(false)}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.error }]} onPress={() => { setShowConfirmEmpty(false); setShowFinalEmpty(true); }}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Final Confirmation Modal */}
      <Modal visible={showFinalEmpty} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#FAD4D4' }]}>
              <Feather name="trash-2" size={24} color="#B71C1C" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Final Confirmation</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>Are you absolutely sure? This will delete everything in the database.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setShowFinalEmpty(false)} disabled={isClearing}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{isClearing ? 'Please wait...' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.error }]} onPress={performClearData} disabled={isClearing}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{isClearing ? 'Deleting...' : 'Yes, Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    padding: 24,
    marginBottom: 16,
  },
  gradientHeader: {
    padding: 16,
    paddingTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 16,
  },
  statsContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  disabledItem: {
    opacity: 0.6,
  },
  actionCard: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A5D3F',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'left',
  },
  disabledText: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 30,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  refreshButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A5D3F',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});