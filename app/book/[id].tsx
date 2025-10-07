import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { Book } from '@/types'; const { width } = Dimensions.get('window');

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, deleteBook } = useBookStore();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    if (id) {
      const foundBook = books.find((b: Book) => b.id === id);
      setBook(foundBook || null);
    }
  }, [id, books]);

  const handleEdit = () => {
    if (book) {
      router.push(`/book/edit/${book.id}`);
    }
  };

  const handleDelete = () => {
    if (!book) return;

    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(book.id);
              Alert.alert(
                'Success',
                'Book deleted successfully.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete book. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!book) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Details</Text>
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="book-outline" size={64} color={Colors.textLight} />
          <Text style={styles.notFoundText}>Book not found</Text>
          <Text style={styles.notFoundSubtext}>The requested book could not be found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bookHeader}>
          <View style={styles.coverContainer}>
            {book.coverUrl ? (
              <Image source={{ uri: book.coverUrl }} style={styles.cover} />
            ) : (
              <View style={styles.placeholderCover}>
                <Ionicons name="book-outline" size={40} color={Colors.textLight} />
              </View>
            )}
          </View>

          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.name}</Text>
            <Text style={styles.bookPrice}>{formatPrice(book.price)}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          {book.author && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Author</Text>
                <Text style={styles.detailValue}>{book.author}</Text>
              </View>
            </View>
          )}

          {book.publisher && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="business-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Publisher</Text>
                <Text style={styles.detailValue}>{book.publisher}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Added</Text>
              <Text style={styles.detailValue}>{formatDate(book.createdAt)}</Text>
            </View>
          </View>

          {book.updatedAt !== book.createdAt && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>{formatDate(book.updatedAt)}</Text>
              </View>
            </View>
          )}
        </View>

        {book.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{book.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleEdit}>
            <Ionicons name="pencil" size={20} color={Colors.surface} />
            <Text style={styles.primaryActionText}>Edit Book</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.secondaryActionText}>Delete Book</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
  },
  content: {
    flex: 1,
  },
  bookHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverContainer: {
    marginRight: 16,
  },
  cover: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  placeholderCover: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  bookPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsSection: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  notesSection: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  notesContainer: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  actionsSection: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginTop: 8,
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
