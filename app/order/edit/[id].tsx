import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { Book, Order, OrderItem } from '@/types';
import { Feather } from '@expo/vector-icons';
import { SearchBar } from '@/components';

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { books, getOrderById, updateOrder } = useBookStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Order['status']>('pending');

  // Book search modal state
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  useEffect(() => {
    (async () => {
      const existing = await getOrderById(String(id));
      if (!existing) {
        Alert.alert('Not found', 'Order not found');
        router.back();
        return;
      }
      setOrder(existing);
      setCustomerName(existing.customerName);
      setCustomerPhone(existing.customerPhone || '');
      setCustomerEmail(existing.customerEmail || '');
      setCustomerAddress(existing.customerAddress || '');
      setItems(existing.items);
      setStatus(existing.status);
      setLoading(false);
    })();
  }, [id]);

  const totalAmount = useMemo(() => {
    // Treat discount as percentage across the app
    return items.reduce((sum, it) => {
      const gross = it.unitPrice * it.quantity;
      const disc = ((it.discount || 0) / 100) * gross;
      return sum + (gross - disc);
    }, 0);
  }, [items]);

  const onSave = async () => {
    if (!order) return;
    if (!customerName.trim()) {
      Alert.alert('Error', 'Customer name is required.');
      return;
    }
    setSaving(true);
    try {
      const updated: Order = {
        ...order,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        items: items.map(i => ({ ...i, discount: i.discount || 0 })),
        totalAmount: totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        status,
      };
      const saved = await updateOrder(updated);
      Alert.alert('Saved', 'Order updated successfully');
      router.replace(`/order/${saved.id}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const incQty = (idx: number) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
  const decQty = (idx: number) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
  const setDisc = (idx: number, v: string) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, discount: Number(v) || 0 } : it));
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  // Book filtering for modal
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredBooks(books);
      return;
    }
    setFilteredBooks(
      books.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.author ? b.author.toLowerCase().includes(q) : false)
      )
    );
  }, [searchQuery, books]);

  const addBookToItems = (book: Book) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.bookId === book.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      const newItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        orderId: String(order?.id || ''),
        bookId: book.id,
        bookName: book.name,
        quantity: 1,
        unitPrice: book.price,
        discount: 0,
      };
      return [...prev, newItem];
    });
    setShowBookSearch(false);
    setSearchQuery('');
  };

  if (loading || !order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Loading order…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Order #{order.id}</Text>
        <TouchableOpacity onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Name" placeholderTextColor={Colors.textLight} />
        <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} placeholder="Phone" placeholderTextColor={Colors.textLight} keyboardType="phone-pad" />
        <TextInput style={styles.input} value={customerEmail} onChangeText={setCustomerEmail} placeholder="Email" placeholderTextColor={Colors.textLight} keyboardType="email-address" />
        <TextInput style={[styles.input, styles.textArea]} value={customerAddress} onChangeText={setCustomerAddress} placeholder="Address" placeholderTextColor={Colors.textLight} multiline />

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Status</Text>
        <View style={styles.statusRow}>
          {(['pending', 'completed', 'cancelled'] as Order['status'][]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.statusChip, s === status ? { backgroundColor: Colors.primary } : { backgroundColor: '#E5E7EB' }]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.statusChipText, { color: s === status ? '#FFFFFF' : Colors.text }]}>
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Items</Text>
        <View style={styles.itemsHeader}>
          <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowBookSearch(true)}>
            <Feather name="plus" size={16} color={Colors.surface} />
            <Text style={styles.addItemBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
        {items.map((it, idx) => (
          <View key={it.id || idx} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.bookName}</Text>
              <Text style={styles.itemPrice}>৳{it.unitPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.qtyWrap}>
              <TouchableOpacity onPress={() => decQty(idx)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
              <Text style={styles.qty}>{it.quantity}</Text>
              <TouchableOpacity onPress={() => incQty(idx)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
            </View>
            <TextInput
              style={[styles.discInput]}
              value={String(it.discount ?? 0)}
              onChangeText={(v) => setDisc(idx, v)}
              keyboardType="numeric"
              placeholder="Disc"
              placeholderTextColor={Colors.textLight}
            />
            <TouchableOpacity onPress={() => removeItem(idx)} style={styles.itemDeleteBtn}>
              <Feather name="trash-2" size={16} color={Colors.surface} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>৳{totalAmount.toFixed(2)}</Text>
        </View>
      </ScrollView>

      {/* Book Search Modal */}
      <Modal visible={showBookSearch} animationType="slide">
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Books</Text>
            <TouchableOpacity onPress={() => setShowBookSearch(false)}>
              <Feather name="x" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search books to add..." />
          </View>
          <FlatList
            data={filteredBooks}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: b }) => (
              <TouchableOpacity style={styles.bookCard} onPress={() => addBookToItems(b)}>
                <View>
                  <Text style={styles.bookTitle}>{b.name}</Text>
                  {!!b.author && <Text style={styles.bookAuthor}>{b.author}</Text>}
                </View>
                <Text style={styles.bookPrice}>৳{b.price}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: Colors.surface, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, marginBottom: 10 },
  textArea: { minHeight: 70 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemPrice: { fontSize: 12, color: Colors.textSecondary },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  qtyBtnText: { fontWeight: '800', color: Colors.text },
  qty: { width: 24, textAlign: 'center', color: Colors.text },
  discInput: { width: 70, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: Colors.text },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  itemsHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addItemBtnText: { color: Colors.surface, fontWeight: '700' },
  itemDeleteBtn: { marginLeft: 6, backgroundColor: Colors.error, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  bookCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginBottom: 10, backgroundColor: Colors.surface },
  bookTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  bookAuthor: { fontSize: 12, color: Colors.textSecondary },
  bookPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
