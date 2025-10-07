import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Book as BookType } from '@/types';

interface BookCardProps {
  book: BookType;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function BookCard({ book, onPress, onEdit, onDelete, showActions = true }: BookCardProps) {
  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.coverContainer}>
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.cover} />
          ) : (
            <View style={styles.placeholderCover}>
              <Feather name="book" size={24} color={Colors.textLight} />
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {book.name}
          </Text>

          {book.author && (
            <Text style={styles.author} numberOfLines={1}>
              by {book.author}
            </Text>
          )}

          {book.publisher && (
            <Text style={styles.publisher} numberOfLines={1}>
              {book.publisher}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.price}>{formatPrice(book.price)}</Text>
            <Text style={styles.date}>{formatDate(book.updatedAt)}</Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Feather name="edit-3" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Feather name="trash-2" size={16} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  coverContainer: {
    marginRight: 16,
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
  },
  placeholderCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  publisher: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  date: {
    fontSize: 12,
    color: Colors.textLight,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginVertical: 2,
  },
});