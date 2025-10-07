import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useToast } from '@/components';
import { useBookStore } from '@/hooks/useBookStore';
import { Book } from '@/types';

export default function EditBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, updateBook } = useBookStore();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    author: '',
    publisher: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (id) {
      const book = books.find((b: Book) => b.id === id);
      if (book) {
        setFormData({
          name: book.name,
          price: book.price.toString(),
          author: book.author || '',
          publisher: book.publisher || '',
          notes: book.notes || '',
        });
      } else {
        Alert.alert('Error', 'Book not found.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id, books]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasChanges(true);
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
    if (!validateForm() || !id) return;

    setLoading(true);
    try {
      await updateBook(id, {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        author: formData.author.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.show({ title: 'Book updated', message: formData.name.trim(), type: 'success', durationMs: 2000 });
      setTimeout(() => router.back(), 300);
    } catch (error) {
      Alert.alert('Error', 'Failed to update book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Book</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, loading && styles.disabledButton]}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.coverSection}>
            <View style={styles.coverPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={Colors.textLight} />
              <Text style={styles.coverText}>Update Cover Photo</Text>
              <Text style={styles.coverSubtext}>Tap to select image</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Book Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value: string) => handleInputChange('name', value)}
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
              onChangeText={(value: string) => handleInputChange('price', value)}
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
              onChangeText={(value: string) => handleInputChange('author', value)}
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
              onChangeText={(value: string) => handleInputChange('publisher', value)}
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
              onChangeText={(value: string) => handleInputChange('notes', value)}
              placeholder="Additional notes about this book"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  disabledButton: {
    opacity: 0.6,
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
});
