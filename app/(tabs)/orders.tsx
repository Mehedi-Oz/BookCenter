import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { SearchBar } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import { Order } from '@/types';
import { useTheme } from '@/hooks/useTheme';

export default function OrdersScreen() {
  const { orders, loading, refreshData, deleteOrder } = useBookStore();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter orders based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        return (
          // Search by order ID
          order.id.toLowerCase().includes(query) ||
          // Search by customer name
          order.customerName.toLowerCase().includes(query) ||
          // Search by customer phone
          (order.customerPhone && order.customerPhone.includes(query)) ||
          // Search by status
          order.status.toLowerCase().includes(query) ||
          // Search by items in the order
          order.items.some(item =>
            item.bookName.toLowerCase().includes(query)
          )
        );
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const handleEditOrder = (order: Order) => {
    router.push(`/order/edit/${order.id}` as any);
  };

  const handleDeleteOrder = (order: Order) => {
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
              if (!ok) throw new Error('Delete returned false');
              Alert.alert('Deleted', `Order #${order.id} deleted.`);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete order. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/order/${item.id}` as any)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderId, { color: colors.text }]}>Order #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Feather name="user" size={16} color={colors.textSecondary} />
        <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
        {item.customerPhone && (
          <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>• {item.customerPhone}</Text>
        )}
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderStat}>
          <Feather name="clipboard" size={16} color={colors.textSecondary} />
          <Text style={[styles.orderStatText, { color: colors.textSecondary }]}>
            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.orderStat}>
          <Feather name="dollar-sign" size={16} color={colors.primary} />
          <Text style={[styles.orderStatText, { color: colors.primary, fontWeight: '600' }]}>
            {formatPrice(item.finalAmount)}
          </Text>
        </View>
      </View>

      {/* Card actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.border }]}
          onPress={() => handleEditOrder(item)}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={16} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => handleDeleteOrder(item)}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={16} color="#FFFFFF" />
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Removed per request: do not show individual book names on order cards */}
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (searchQuery.trim()) {
      return (
        <EmptyState
          icon="search"
          title="No orders found"
          subtitle={`No orders match "${searchQuery}". Try adjusting your search terms.`}
        />
      );
    }

    return (
      <EmptyState
        icon="clipboard"
        title="No orders yet"
        subtitle="Start creating orders to track your sales and manage customer purchases."
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/order/create' as any)}
        >
          <Text style={styles.addButtonText}>Create Your First Order</Text>
        </TouchableOpacity>
      </EmptyState>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.gradientHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.pageTitle, { fontSize: 26, fontWeight: 'bold', color: '#4A5D3F' }]}>Orders Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search orders by ID, customer, status, or items..."
          fullWidth
        />
      </View>

      <View style={styles.header}>
        <Text style={[styles.orderCount, { color: colors.textSecondary }]}>
          {searchQuery.trim()
            ? `${filteredOrders.length} result${filteredOrders.length !== 1 ? 's' : ''} found`
            : `${orders.length} order${orders.length !== 1 ? 's' : ''}`
          }
        </Text>

        <TouchableOpacity
          style={[styles.addFloatingButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/order/create' as any)}
        >
          <Feather name="plus" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  orderCount: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addFloatingButton: {
    backgroundColor: Colors.secondary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  itemsPreview: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  itemPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
});