import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface SimpleCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onTextDetected?: (text: string) => void;
}

const { width, height } = Dimensions.get('window');

export function SimpleCameraModal({ visible, onClose, onTextDetected }: SimpleCameraModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { colors } = useTheme();

  const simulateOCRScan = () => {
    setIsScanning(true);

    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
      const mockScannedText = "Harry Potter and the Philosopher's Stone";

      if (onTextDetected) {
        onTextDetected(mockScannedText);
      }

      Alert.alert(
        'Scan Complete!',
        `Found: "${mockScannedText}"`,
        [{ text: 'OK', onPress: onClose }]
      );
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(74, 93, 63, 0.45)' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>Camera Book Scanner</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.cameraPreview, { backgroundColor: colors.surfaceVariant }]}>
            <Feather name="camera" size={64} color={colors.primary} />
            <Text style={[styles.cameraText, { color: colors.textSecondary }]}>
              {isScanning ? 'Scanning book cover...' : 'Point camera at book cover'}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.scanButton,
                { backgroundColor: colors.primary },
                isScanning && [styles.scanButtonDisabled, { backgroundColor: colors.border }],
              ]}
              onPress={simulateOCRScan}
              disabled={isScanning}
            >
              <Text style={[styles.scanButtonText, { color: colors.surface }]}>
                {isScanning ? 'Scanning...' : 'Scan Book Cover'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.instructions, { color: colors.textLight }]}>
            This is a demo version. In production, this would use the device camera to scan book covers and extract text using OCR.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    margin: 20,
    width: width * 0.75,
    maxHeight: height * 0.6,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  cameraPreview: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
