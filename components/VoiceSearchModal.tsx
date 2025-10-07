import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBookStore } from '@/hooks/useBookStore';

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onTextDetected: (text: string) => void;
  onBookMatched?: (bookName: string) => void;
}

export function VoiceSearchModal({ visible, onClose, onTextDetected, onBookMatched }: VoiceSearchModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [matchedBooks, setMatchedBooks] = useState<string[]>([]);
  const { colors } = useTheme();
  const { books } = useBookStore();

  // Animation for the pulse effect
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Handle permission request automatically
  const handlePermissionRequest = async () => {
    try {
      const audioPermission = await Audio.requestPermissionsAsync();
      setHasPermission(audioPermission.granted);

      if (audioPermission.granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } else {
        Alert.alert(
          'Microphone Permission Required',
          'Microphone access is needed for voice search. Please enable it in your device settings.',
          [
            { text: 'Cancel', onPress: onClose },
            { text: 'OK', onPress: onClose }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      onClose();
    }
  };

  // Request permission when modal opens
  useEffect(() => {
    if (visible && !hasPermission) {
      handlePermissionRequest();
    }
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [visible]);

  useEffect(() => {
    if (isListening) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const startListening = async () => {
    if (!hasPermission) {
      handlePermissionRequest();
      return;
    }

    try {
      setIsListening(true);
      setRecordedText('');
      setMatchedBooks([]);

      // Provide audio feedback
      Speech.speak('Listening for book search', {
        language: 'en',
        pitch: 1.0,
        rate: 1.0,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      await newRecording.startAsync();
      setRecording(newRecording);

      // Auto-stop after 8 seconds
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 8000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice recording. Please try again.');
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    try {
      setIsListening(false);
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Simulate speech-to-text processing
      setTimeout(() => {
        simulateSpeechToText();
      }, 1500);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process voice recording. Please try again.');
    }
  };

  const simulateSpeechToText = () => {
    // Simulate speech-to-text conversion with realistic book search terms
    const simulatedResults = [
      'Harry Potter',
      'Lord of the Rings',
      'Game of Thrones',
      'The Great Gatsby',
      'To Kill a Mockingbird',
      'Pride and Prejudice',
      'The Catcher in the Rye',
      'The Hobbit',
      'Fahrenheit 451',
      'The Da Vinci Code'
    ];

    const randomResult = simulatedResults[Math.floor(Math.random() * simulatedResults.length)];

    setRecordedText(randomResult);
    setIsProcessing(false);

    // Search for matching books
    const matches = findBookMatches(randomResult);
    setMatchedBooks(matches);

    if (matches.length > 0) {
      showMatchResults(matches, randomResult);
    } else {
      showNoMatchResults(randomResult);
    }
  };

  const findBookMatches = (spokenText: string): string[] => {
    const matches: string[] = [];
    const searchTerm = spokenText.toLowerCase();

    books.forEach((book: any) => {
      const bookName = book.name.toLowerCase();
      const bookAuthor = (book.author || '').toLowerCase();
      const bookPublisher = (book.publisher || '').toLowerCase();

      // Enhanced matching algorithm
      if (bookName.includes(searchTerm) ||
        searchTerm.includes(bookName) ||
        bookAuthor.includes(searchTerm) ||
        bookPublisher.includes(searchTerm)) {
        if (!matches.includes(book.name)) {
          matches.push(book.name);
        }
      }
    });

    return matches.slice(0, 5); // Return top 5 matches
  };

  const showMatchResults = (matches: string[], spokenText: string) => {
    const message = matches.length === 1
      ? `Found a match for "${spokenText}": ${matches[0]}`
      : `Found ${matches.length} matches for "${spokenText}":\n${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`;

    Alert.alert(
      'Voice Search Results',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search Inventory',
          onPress: () => {
            onTextDetected(matches[0]);
            onBookMatched?.(matches[0]);
            resetAndClose();
          }
        }
      ]
    );
  };

  const showNoMatchResults = (spokenText: string) => {
    Alert.alert(
      'No Exact Matches',
      `No exact matches found for "${spokenText}". Would you like to search the inventory anyway?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search Anyway',
          onPress: () => {
            onTextDetected(spokenText);
            resetAndClose();
          }
        }
      ]
    );
  };

  const resetAndClose = () => {
    setIsListening(false);
    setIsProcessing(false);
    setRecordedText('');
    setMatchedBooks([]);
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    onClose();
  };

  const getStatusText = () => {
    if (isProcessing) return 'Converting speech to text...';
    if (isListening) return 'Listening... Speak now!';
    return 'Tap the microphone to start voice search';
  };

  const getStatusColor = () => {
    if (isProcessing) return colors.warning;
    if (isListening) return colors.success;
    return colors.textSecondary;
  };

  // Don't show custom permission UI, let system handle it
  if (!hasPermission) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Voice Search</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Microphone Button */}
            <View style={styles.microphoneContainer}>
              <Animated.View style={[
                styles.microphoneWrapper,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isListening ? colors.success : colors.primary,
                }
              ]}>
                <TouchableOpacity
                  style={styles.microphoneButton}
                  onPress={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : (
                    <Feather
                      name="mic"
                      size={48}
                      color="white"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Status Text */}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>

            {/* Recorded Text Display */}
            {recordedText ? (
              <View style={[styles.textContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.textLabel, { color: colors.textSecondary }]}>
                  Detected Speech:
                </Text>
                <Text style={[styles.recordedText, { color: colors.text }]}>
                  "{recordedText}"
                </Text>
              </View>
            ) : null}

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={[styles.instructionTitle, { color: colors.text }]}>
                Voice Search Tips:
              </Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                • Speak clearly and at normal pace
              </Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                • Include book title, author, or publisher
              </Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                • Recording automatically stops after 8 seconds
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  microphoneContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  microphoneWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  microphoneButton: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  textContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  textLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  recordedText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  instructionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 12,
    marginBottom: 4,
    paddingLeft: 8,
  },
});
