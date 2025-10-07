import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useBookStore } from '@/hooks/useBookStore';
import { RefreshControl } from 'react-native';
import { Order, OrderItem } from '@/types';

export default function OrderDetailsScreen() {
  const { colors } = useTheme();
  const { orders, refreshData, deleteOrder } = useBookStore();
  const params = useLocalSearchParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const foundOrder = orders.find(o => o.id === orderId);
    setOrder(foundOrder || null);
  }, [orderId, orders]);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Feather name="search" size={48} color={colors.textSecondary} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date: dateStr, time: timeStr };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const handleEditOrder = () => {
    if (!order) return;
    router.push(`/order/edit/${order.id}` as any);
  };

  const handleDeleteOrder = () => {
    if (!order) return;
    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this order? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const ok = await deleteOrder(order.id);
              if (ok) {
                Alert.alert('Deleted', `Order #${order.id} deleted.`);
                router.back();
              } else {
                Alert.alert('Error', 'Failed to delete order.');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete order.');
            }
          },
        },
      ]
    );
  };

  const renderOrderItem = ({ item, index }: { item: OrderItem; index: number }) => {
    const itemTotal = item.unitPrice * item.quantity;
    const discountAmount = (itemTotal * item.discount) / 100;
    const finalPrice = itemTotal - discountAmount;

    return (
      <View style={[styles.orderItemRow, { backgroundColor: colors.surface }]}>
        <Text style={[styles.serialNumber, { color: colors.textSecondary }]}>
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
            {item.bookName}
          </Text>
        </View>
        <Text style={[styles.itemQuantity, { color: colors.text }]}>
          {item.quantity}
        </Text>
        <Text style={[styles.itemDiscount, { color: colors.accent }]}>
          {item.discount}%
        </Text>
        <Text style={[styles.itemPrice, { color: colors.primary }]}>
          ৳{finalPrice.toLocaleString()}
        </Text>
      </View>
    );
  };

  const { date, time } = formatDateTime(order.createdAt);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
        <TouchableOpacity onPress={handleEditOrder}>
          <Feather name="edit-3" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              try {
                setIsRefreshing(true);
                await refreshData();
              } finally {
                setIsRefreshing(false);
              }
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Customer Details Card (combined: order no, date, customer info) */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Details</Text>
          <View style={styles.customerInfo}>
            {/* Order Number */}
            <View style={styles.customerRow}>
              <Feather name="hash" size={16} color={colors.textSecondary} />
              <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>Order #:</Text>
              <Text style={[styles.customerValue, { color: colors.text }]}>#{order.id}</Text>
            </View>
            {/* Order Date */}
            <View style={styles.customerRow}>
              <Feather name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>Date:</Text>
              <Text style={[styles.customerValue, { color: colors.text }]}>{date} • {time}</Text>
            </View>
            <View style={styles.customerRow}>
              <Feather name="user" size={16} color={colors.textSecondary} />
              <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.customerValue, { color: colors.text }]}>{order.customerName}</Text>
            </View>
            {order.customerPhone && (
              <View style={styles.customerRow}>
                <Feather name="phone" size={16} color={colors.textSecondary} />
                <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>Phone:</Text>
                <Text style={[styles.customerValue, { color: colors.text }]}>{order.customerPhone}</Text>
              </View>
            )}
            {order.customerAddress && (
              <View style={styles.customerRow}>
                <Feather name="map-pin" size={16} color={colors.textSecondary} />
                <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>Address:</Text>
                <Text style={[styles.customerValue, { color: colors.text }]}>{order.customerAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* (Removed separate Date & Time card; included above) */}

        {/* Order Items Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Order Items</Text>

          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.thSerial, { color: colors.textSecondary }]}>SL</Text>
            <Text style={[styles.thName, { color: colors.textSecondary }]}>Book Name</Text>
            <Text style={[styles.thQty, { color: colors.textSecondary }]}>Qty</Text>
            <Text style={[styles.thDisc, { color: colors.textSecondary }]}>Disc</Text>
            <Text style={[styles.thPrice, { color: colors.textSecondary }]}>Price</Text>
          </View>

          {/* Order Items */}
          <FlatList
            data={order.items}
            renderItem={renderOrderItem}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            scrollEnabled={false}
          />

          {/* Total */}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              ৳{order.finalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customerInfo: {
    gap: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerLabel: {
    fontSize: 14,
    minWidth: 60,
  },
  customerValue: {
    fontSize: 14,
    flex: 1,
  },
  dateTimeInfo: {
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeLabel: {
    fontSize: 14,
    minWidth: 40,
  },
  dateTimeValue: {
    fontSize: 14,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  thSerial: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  thName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    paddingHorizontal: 8,
  },
  thQty: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  thDisc: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  thPrice: {
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  serialNumber: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 14,
    width: 40,
    textAlign: 'center',
  },
  itemDiscount: {
    fontSize: 14,
    width: 50,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
