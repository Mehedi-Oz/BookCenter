import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { useTheme } from '@/hooks/useTheme';

export default function ImportScreen() {
  const router = useRouter();
  const { importBooksFromCSV } = useBookStore();
  const { colors } = useTheme();
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportFile = async () => {
    try {
      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert('Error', 'No file selected.');
        return;
      }

      // Show confirmation
      Alert.alert(
        'Import Books from CSV',
        `Selected file: ${file.name}\n\nThis will:\n• Add new books\n• Update prices of existing books\n• Skip books with same price\n\nContinue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              setIsImporting(true);
              setImportProgress(0);
              setImportStatus('Reading CSV file...');

              try {
                // Read file content
                const response = await fetch(file.uri);
                const csvContent = await response.text();

                if (!csvContent.trim()) {
                  throw new Error('CSV file is empty');
                }

                setImportStatus('Processing books...');

                // Import books with progress tracking
                const results = await importBooksFromCSV(csvContent, (progress, status) => {
                  setImportProgress(progress);
                  setImportStatus(status);
                });

                setIsImporting(false);

                // Show results
                const { added, updated, skipped, errors } = results;
                const totalProcessed = added + updated + skipped;

                let message = `Import completed!\n\n`;
                message += `📚 Books added: ${added}\n`;
                message += `📝 Books updated: ${updated}\n`;
                message += `⏭️ Books skipped: ${skipped}\n`;
                if (errors.length > 0) {
                  message += `❌ Errors: ${errors.length}\n`;
                }
                message += `\nTotal processed: ${totalProcessed}`;

                if (errors.length > 0) {
                  message += `\n\nFirst few errors:\n${errors.slice(0, 3).join('\n')}`;
                  if (errors.length > 3) {
                    message += `\n...and ${errors.length - 3} more`;
                  }
                }

                Alert.alert('Import Results', message, [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.back();
                    }
                  }
                ]);

              } catch (error) {
                setIsImporting(false);
                console.error('Import error:', error);
                Alert.alert(
                  'Import Failed',
                  error instanceof Error ? error.message : 'Unknown error occurred during import.'
                );
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to open file picker.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.guideCard, { backgroundColor: colors.surface }]}>
          <View style={styles.guideHeader}>
            <Feather name="file-text" size={24} color={colors.primary} />
            <Text style={[styles.guideTitle, { color: colors.text }]}>CSV Format Guide</Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Required Columns</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Name - Book title (required)</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Price - Book price in numbers (required)</Text>
          </View>
          <View style={styles.guideSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Optional Columns</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Author - Author name</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Publication - Publisher/publication</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Details - Additional book details</Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📄 Example CSV Format</Text>
            <View style={[styles.exampleCode, { backgroundColor: colors.border }]}>
              <Text style={[styles.codeText, { color: colors.textSecondary }]}>
                Name,Author,Publication,Price,Details{'\n'}
                Book A,John,ABC Press,12.99,Good book{'\n'}
                Book B,Jane,XYZ Ltd,8.50,Nice read{'\n'}
                Book C,Bob,DEF Co,15.00,Great story
              </Text>
            </View>
          </View>

          <View style={styles.guideSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 Tips</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Price should be numbers only (no currency symbols)</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• First row should be headers</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• File should be saved as .csv format</Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Import Behavior</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Add new books</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Update prices if different</Text>
            <Text style={[styles.columnItem, { color: colors.textSecondary }]}>• Skip books with same price</Text>
          </View>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[styles.importButton, { backgroundColor: colors.primary }]}
          onPress={handleImportFile}
        >
          <Feather name="upload" size={24} color="white" />
          <Text style={styles.importButtonText}>Select CSV File to Import</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Import Progress Modal */}
      <Modal visible={isImporting} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Importing Books</Text>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${importProgress}%` }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {Math.round(importProgress)}%
              </Text>
            </View>

            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {importStatus}
            </Text>

            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  guideCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  guideSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  columnItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  exampleCode: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  loader: {
    marginTop: 8,
  },
});
