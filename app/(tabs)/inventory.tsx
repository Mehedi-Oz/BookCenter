import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { SearchBar, SimpleCameraModal, SimpleVoiceModal, useToast } from '@/components';
import { BookCard } from '@/components/BookCards';
import { EmptyState } from '@/components/EmptyState';
import { Book } from '@/types';
import { useTheme } from '@/hooks/useTheme';

export default function InventoryScreen() {
  const { books, loading, deleteBook, searchBooks, refreshData } = useBookStore();
  const { colors } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showOCRCamera, setShowOCRCamera] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle search parameters from navigation (including OCR results)
  useEffect(() => {
    if (params.search && typeof params.search === 'string') {
      setSearchQuery(params.search);
    }
  }, [params.search]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setFilteredBooks(books);
      setIsSearching(false);
    }
  }, [searchQuery, books]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchBooks(searchQuery.trim());
      setFilteredBooks(results);
    } catch (error) {
      console.error('Search failed:', error);
      setFilteredBooks([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOCRTextDetected = (text: string) => {
    setSearchQuery(text);
    // The search will be triggered automatically by the useEffect
  };

  const handleVoiceTextDetected = (text: string) => {
    setSearchQuery(text);
    // The search will be triggered automatically by the useEffect
  };

  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.id}`);
  };

  const handleEditBook = (book: Book) => {
    router.push(`/book/edit/${book.id}`);
  };

  const handleDeleteBook = (book: Book) => {
    setDeleteTarget(book);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteBook(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      toast.show({ title: 'Book deleted', message: deleteTarget.name, type: 'info', durationMs: 2000 });
    } catch (error) {
      // fallback banner to indicate error
      toast.show({ title: 'Delete failed', message: 'Please try again.', type: 'error', durationMs: 2500 });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard
      book={item}
      onPress={() => handleBookPress(item)}
      onEdit={() => handleEditBook(item)}
      onDelete={() => handleDeleteBook(item)}
    />
  );

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <EmptyState
          icon="filter"
          title="No books found"
          subtitle={`No books match "${searchQuery}". Try adjusting your search terms.`}
        />
      );
    }

    return (
      <EmptyState
        icon="plus"
        title="No books yet"
        subtitle="Start building your inventory by adding your first book."
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/book/add')}
        >
          <Text style={styles.addButtonText}>Add Your First Book</Text>
        </TouchableOpacity>
      </EmptyState>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.gradientHeader, { backgroundColor: colors.background }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setHeaderHeight(h);
          // push toast below header + search container
          // header contains title; searchContainer has marginTop via styles
          // We'll set a safe offset: header height + 16 (outer margin) + 56 (search bar) + 12 spacing
          const offset = h + 16 + 56 + 12;
          // guard and apply
          if (typeof (toast as any).setTopOffset === 'function') {
            (toast as any).setTopOffset(offset);
          }
        }}
      >
        <Text style={[styles.pageTitle, { fontSize: 26, fontWeight: 'bold', color: '#4A5D3F' }]}>Books Inventory</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search books, authors, publishers..."
          onCameraPress={() => setShowOCRCamera(true)}
          onVoicePress={() => setShowVoiceSearch(true)}
          fullWidth
        />
      </View>

      <View style={styles.header}>
        <Text style={[styles.resultCount, { color: colors.text }]}>
          {searchQuery.trim()
            ? `${filteredBooks.length} result${filteredBooks.length !== 1 ? 's' : ''} found`
            : `${books.length} book${books.length !== 1 ? 's' : ''} in inventory`
          }
        </Text>

        <TouchableOpacity
          style={[styles.addFloatingButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/book/add')}
        >
          <Feather name="plus" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshing={isRefreshing}
        onRefresh={async () => {
          try {
            setIsRefreshing(true);
            await refreshData();
          } finally {
            setIsRefreshing(false);
          }
        }}
      />

      <SimpleCameraModal
        visible={showOCRCamera}
        onClose={() => setShowOCRCamera(false)}
        onTextDetected={handleOCRTextDetected}
      />

      <SimpleVoiceModal
        visible={showVoiceSearch}
        onClose={() => setShowVoiceSearch(false)}
        onTextDetected={handleVoiceTextDetected}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => !isDeleting && setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#FDECEA' }]}>
              <Feather name="trash-2" size={24} color={colors.error} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Book?</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} disabled={isDeleting} onPress={() => setShowDeleteModal(false)}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{isDeleting ? 'Please wait…' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.error }]} disabled={isDeleting} onPress={confirmDelete}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{isDeleting ? 'Deleting…' : 'Yes, Delete'}</Text>
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
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    margin: 16,
    alignSelf: 'stretch',
  },
  resultCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addFloatingButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal styles
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