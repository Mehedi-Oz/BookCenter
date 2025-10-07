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

interface SimpleVoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onTextDetected?: (text: string) => void;
}

const { width, height } = Dimensions.get('window');

export function SimpleVoiceModal({ visible, onClose, onTextDetected }: SimpleVoiceModalProps) {
  const [isListening, setIsListening] = useState(false);
  const { colors } = useTheme();

  const simulateVoiceSearch = () => {
    setIsListening(true);

    // Simulate listening delay
    setTimeout(() => {
      setIsListening(false);
      const mockVoiceText = "Lord of the Rings";

      if (onTextDetected) {
        onTextDetected(mockVoiceText);
      }

      Alert.alert(
        'Voice Recognition Complete!',
        `You said: "${mockVoiceText}"`,
        [{ text: 'OK', onPress: onClose }]
      );
    }, 3000);
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
            <Text style={[styles.title, { color: colors.primary }]}>Voice Search</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.microphoneArea}>
            <View style={[
              styles.microphoneIcon,
              { backgroundColor: colors.surfaceVariant },
              isListening && [styles.listening, { backgroundColor: '#FDECEA' }],
            ]}>
              <Feather name="mic" size={48} color={isListening ? colors.error : colors.primary} />
            </View>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {isListening ? 'Listening... Speak now!' : 'Tap to start voice search'}
            </Text>
            {isListening && (
              <View style={styles.waveform}>
                <View style={[styles.wave, { backgroundColor: colors.error }]} />
                <View style={[styles.wave, { backgroundColor: colors.error }]} />
                <View style={[styles.wave, { backgroundColor: colors.error }]} />
                <View style={[styles.wave, { backgroundColor: colors.error }]} />
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.listenButton,
                { backgroundColor: colors.primary },
                isListening && [styles.listenButtonActive, { backgroundColor: colors.error }],
              ]}
              onPress={simulateVoiceSearch}
              disabled={isListening}
            >
              <Text style={[styles.listenButtonText, { color: colors.surface }]}>
                {isListening ? 'Listening...' : 'Start Voice Search'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.instructions, { color: colors.textLight }]}>
            This is a demo version. In production, this would use the device microphone to capture voice input and convert it to text for book searching.
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
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  microphoneArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  microphoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  listening: {
    backgroundColor: '#ffe0e0',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  wave: {
    width: 4,
    height: 20,
    backgroundColor: '#ff4444',
    borderRadius: 2,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  listenButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  listenButtonActive: {
    backgroundColor: '#ff4444',
  },
  listenButtonText: {
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
