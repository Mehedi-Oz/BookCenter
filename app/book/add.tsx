import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { useToast } from '@/components';

export default function AddBookScreen() {
  const { addBook } = useBookStore();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    author: '',
    publisher: '',
    notes: '',
  });
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation using HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              setCoverUrl(e.target.result);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Mobile implementation
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePicture = async () => {
    try {
      if (Platform.OS === 'web') {
        // On web, camera access is more complex, so just use file picker
        Alert.alert('Camera not available', 'Please use Photo Library option on web.');
        return;
      }

      // Mobile implementation
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const selectImageSource = () => {
    if (Platform.OS === 'web') {
      // On web, just use file picker directly
      pickImage();
      return;
    }

    // On mobile, show options
    Alert.alert(
      'Select Image',
      'Choose how you want to add a cover photo',
      [
        { text: 'Camera', onPress: takePicture },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Book name is required.');
      return false;
    }

    if (!formData.price.trim()) {
      Alert.alert('Error', 'Price is required.');
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    console.log('HandleSave called');
    console.log('Form data:', formData);
    console.log('Cover URL:', coverUrl);

    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    console.log('Validation passed, starting save...');
    setLoading(true);

    try {
      const bookData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        author: formData.author.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        coverUrl: coverUrl || undefined,
      };

      console.log('Saving book with data:', bookData);
      console.log('Calling addBook function...');

      const result = await addBook(bookData);
      console.log('AddBook result:', result);

      console.log('Book saved successfully!');
      toast.show({ title: 'Book saved', message: bookData.name, type: 'success', durationMs: 2200 });
      // Navigate back shortly after toast shows so user can see it
      setTimeout(() => router.back(), 300);
    } catch (error) {
      console.error('Error saving book:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to add book: ${errorMessage}`);
    } finally {
      setLoading(false);
      console.log('Save operation completed');
    }
  }; const handleCancel = () => {
    const hasChanges = Object.values(formData).some(value => value.trim() !== '');

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.coverSection}>
            <TouchableOpacity
              style={styles.coverContainer}
              onPress={selectImageSource}
              activeOpacity={0.7}
            >
              {coverUrl ? (
                <View style={styles.coverImageContainer}>
                  <Image source={{ uri: coverUrl }} style={styles.coverImage} />
                  <TouchableOpacity
                    style={styles.changeCoverButton}
                    onPress={selectImageSource}
                  >
                    <Feather name="edit-2" size={16} color={Colors.surface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Feather name="camera" size={32} color={Colors.textLight} />
                  <Text style={styles.coverText}>Add Cover Photo</Text>
                  <Text style={styles.coverSubtext}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Book Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter book name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Price (৳) *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(value) => handleInputChange('price', value)}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Author</Text>
            <TextInput
              style={styles.input}
              value={formData.author}
              onChangeText={(value) => handleInputChange('author', value)}
              placeholder="Enter author name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Publisher</Text>
            <TextInput
              style={styles.input}
              value={formData.publisher}
              onChangeText={(value) => handleInputChange('publisher', value)}
              placeholder="Enter publisher name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="Additional notes about this book"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Feather name="x" size={20} color={Colors.textSecondary} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Feather name="save" size={20} color={Colors.surface} />
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Book'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  coverSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  coverContainer: {
    position: 'relative',
  },
  coverImageContainer: {
    position: 'relative',
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  changeCoverButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  coverPlaceholder: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  coverText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  coverSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: Colors.surfaceVariant,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
    marginLeft: 8,
  },
});