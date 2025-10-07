import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useBookStore } from '@/hooks/useBookStore';

interface OCRCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onTextDetected: (text: string) => void;
  onBookMatched?: (bookTitle: string) => void;
}

const { width, height } = Dimensions.get('window');

export function OCRCameraModal({ visible, onClose, onTextDetected, onBookMatched }: OCRCameraModalProps) {
  const [type, setType] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);
  const [matchedBooks, setMatchedBooks] = useState<string[]>([]);
  const { colors } = useTheme();
  const { books } = useBookStore();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        await processImageForOCR(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsProcessing(false);
    }
  };

  const processImageForOCR = async (imageUri: string) => {
    try {
      // First, enhance the image for better OCR results
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1024 } }, // Resize for better processing
          { rotate: 0 }, // Ensure proper orientation
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Simulate OCR processing (in a real app, you'd use an OCR service)
      await simulateOCRProcessing(manipulatedImage.uri);
    } catch (error) {
      console.error('Image processing failed:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  };

  const simulateOCRProcessing = async (imageUri: string) => {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demonstration, we'll simulate extracted text
    // In a real app, you would use an OCR service like Google Vision API, AWS Textract, or Tesseract.js
    const simulatedTexts = [
      'Harry Potter',
      'The Philosopher\'s Stone',
      'J.K. Rowling',
      'Fantasy',
      'Adventure',
      'Magic',
      'Hogwarts',
      'Wizard'
    ];

    setExtractedTexts(simulatedTexts);

    // Match extracted texts with existing books
    const matches = findBookMatches(simulatedTexts);
    setMatchedBooks(matches);

    setIsProcessing(false);

    if (matches.length > 0) {
      showMatchResults(matches);
    } else {
      showTextExtractionResults(simulatedTexts);
    }
  };

  const findBookMatches = (texts: string[]): string[] => {
    const matches: string[] = [];
    const searchTerms = texts.map(text => text.toLowerCase());

    books.forEach(book => {
      const bookName = book.name.toLowerCase();
      const bookAuthor = book.author?.toLowerCase() || '';
      const bookPublisher = book.publisher?.toLowerCase() || '';

      // Check if any extracted text matches book information
      searchTerms.forEach(term => {
        if (term.length > 3) { // Only consider meaningful terms
          if (bookName.includes(term) ||
            bookAuthor.includes(term) ||
            bookPublisher.includes(term) ||
            term.includes(bookName.split(' ')[0]) // Check if book name words are in extracted text
          ) {
            if (!matches.includes(book.name)) {
              matches.push(book.name);
            }
          }
        }
      });
    });

    return matches;
  };

  const showMatchResults = (matches: string[]) => {
    const matchList = matches.slice(0, 5).join('\n• '); // Show up to 5 matches

    Alert.alert(
      '📚 Books Found!',
      `Found ${matches.length} matching book${matches.length > 1 ? 's' : ''} in your inventory:\n\n• ${matchList}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search First Match',
          onPress: () => {
            onTextDetected(matches[0]);
            onBookMatched?.(matches[0]);
            resetAndClose();
          }
        },
        {
          text: 'View All',
          onPress: () => {
            onTextDetected(matches.join(' '));
            resetAndClose();
          }
        }
      ]
    );
  };

  const showTextExtractionResults = (texts: string[]) => {
    const textList = texts.slice(0, 8).join('\n• '); // Show up to 8 extracted texts

    Alert.alert(
      '📖 Text Extracted',
      `No direct matches found, but extracted these texts:\n\n• ${textList}\n\nSearch with extracted text?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search All',
          onPress: () => {
            onTextDetected(texts.join(' '));
            resetAndClose();
          }
        },
        {
          text: 'Choose Text',
          onPress: () => showTextSelectionOptions(texts)
        }
      ]
    );
  };

  const showTextSelectionOptions = (texts: string[]) => {
    // For simplicity, we'll use the first meaningful text
    const meaningfulTexts = texts.filter(text => text.length > 3);
    if (meaningfulTexts.length > 0) {
      onTextDetected(meaningfulTexts[0]);
      resetAndClose();
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setExtractedTexts([]);
    setMatchedBooks([]);
    setIsProcessing(false);
  };

  const resetAndClose = () => {
    setCapturedImage(null);
    setExtractedTexts([]);
    setMatchedBooks([]);
    setIsProcessing(false);
    onClose();
  };

  const toggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  };

  // Handle permission request automatically
  const handlePermissionRequest = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is needed to scan book covers. Please enable it in your device settings.',
          [
            { text: 'Cancel', onPress: onClose },
            { text: 'OK', onPress: onClose }
          ]
        );
        return false;
      }
    }
    return true;
  };

  // Only show modal if we have permission
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingText, { color: colors.text, marginTop: 20 }]}>
            Loading camera...
          </Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Camera Permission</Text>
            <View style={styles.headerButton} />
          </View>

          <View style={[styles.permissionContainer, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
            <Feather name="camera" size={80} color={colors.textSecondary} style={{ marginBottom: 20 }} />
            <Text style={[styles.permissionTitle, { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 10 }]}>
              Camera Access Required
            </Text>
            <Text style={[styles.permissionText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 30, fontSize: 16 }]}>
              To scan book covers and identify books in your inventory, we need access to your camera.
            </Text>

            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10 }]}
              onPress={async () => {
                const result = await requestPermission();
                if (!result.granted) {
                  Alert.alert(
                    'Permission Denied',
                    'Camera access is required to scan book covers. Please enable camera permissions in your browser settings.',
                    [{ text: 'OK', onPress: onClose }]
                  );
                }
              }}
            >
              <Text style={[styles.permissionButtonText, { color: 'white', fontSize: 16, fontWeight: '600' }]}>
                Enable Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 15 }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary, fontSize: 16 }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {capturedImage ? (
          // Image preview and processing screen
          <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={retakePicture} style={styles.headerButton}>
                <Feather name="arrow-left" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Processing Image</Text>
              <TouchableOpacity onPress={resetAndClose} style={styles.headerButton}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.processingText, { color: colors.text }]}>
                    Extracting text from book cover...
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={retakePicture}
                disabled={isProcessing}
              >
                <Feather name="camera" size={20} color="white" />
                <Text style={styles.actionButtonText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Camera view
          <CameraView
            style={styles.camera}
            facing={type}
            ref={cameraRef}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={resetAndClose} style={styles.headerButton}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Scan Book Cover</Text>
              <TouchableOpacity onPress={toggleCameraType} style={styles.headerButton}>
                <Feather name="rotate-cw" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Scanning Frame */}
            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.instructionText}>
                Position book cover within the frame
              </Text>
              <Text style={styles.subInstructionText}>
                Ensure good lighting and clear text visibility
              </Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.controls}>
              <View style={styles.controlSpacer} />

              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isProcessing}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => {
                  Alert.alert(
                    'OCR Scanning Tips',
                    '• Ensure good lighting\n• Keep book cover flat and straight\n• Make sure text is clearly visible\n• Hold steady while capturing\n• Works best with clear, printed text',
                    [{ text: 'Got it' }]
                  );
                }}
              >
                <Feather name="help-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.85,
    height: width * 0.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 32,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontWeight: '600',
  },
  subInstructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlSpacer: {
    width: 48,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  helpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  capturedImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
