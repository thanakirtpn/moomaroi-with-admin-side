import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTable } from '../../contexts/TableContext';
import { API_BASE_URL } from '@env';
console.log('API_BASE_URL:', API_BASE_URL);

const OrderStatusScreen = () => {
  const { tableId } = useTable();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderStatus = useCallback(async () => {
    if (!tableId) {
      setError('ไม่พบหมายเลขโต๊ะ');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/order-status/${tableId.padStart(2, '0')}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Order status data:', data);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching order status:', err);
      setError(err.message || 'ไม่สามารถดึงสถานะคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  const handleOrderPress = (order) => {
    router.push({
      pathname: '/orderDetails',
      params: {
        tableId: tableId || 'N/A',
        orderNumber: order.order_number,
      },
    });
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.orderHeader} onPress={() => handleOrderPress(item)}>
        <FontAwesome name="cutlery" size={24} color="black" />
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item.order_number}</Text>
          <Text style={styles.orderTime}>{item.total_items} Item{item.total_items !== 1 ? 's' : ''}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </TouchableOpacity>

      <View style={styles.statusWrapper}>
        <View style={styles.statusItem}>
          <View style={[styles.iconCircle, styles.activeCircle]}>
            <MaterialIcons name="receipt-long" size={20} color="white" />
          </View>
          <Text style={[styles.stepText, styles.activeText]}>Order Placed</Text>
        </View>
        <View style={styles.lineWrapper}>
          <View style={[styles.solidLine, item.status === 'Order Placed' && styles.inactiveLine]} />
        </View>
        <View style={styles.statusItem}>
          <View
            style={[
              styles.iconCircle,
              item.status === 'Preparing' || item.status === 'Complete'
                ? styles.activeCircle
                : styles.inactiveCircle,
            ]}
          >
            <MaterialIcons
              name="restaurant"
              size={20}
              color={item.status === 'Preparing' || item.status === 'Complete' ? 'white' : 'gray'}
            />
          </View>
          <Text
            style={[
              styles.stepText,
              item.status === 'Preparing' || item.status === 'Complete' ? styles.activeText : {},
            ]}
          >
            Preparing
          </Text>
        </View>
        <View style={styles.lineWrapper}>
          <View style={[styles.dottedLine, item.status === 'Complete' ? styles.solidLine : {}]} />
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.iconCircle, item.status === 'Complete' ? styles.activeCircle : styles.inactiveCircle]}>
            <MaterialIcons
              name="emoji-food-beverage"
              size={20}
              color={item.status === 'Complete' ? 'white' : 'gray'}
            />
          </View>
          <Text style={[styles.stepText, item.status === 'Complete' ? styles.activeText : {}]}>Complete</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Order Status</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderStatus}>
            <Text style={styles.retryButtonText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ไม่พบคำสั่งซื้อสำหรับโต๊ะนี้</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.order_id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.activeNavButton}>
          <MaterialIcons name="restaurant-menu" size={24} color="white" />
          <Text style={styles.navText}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 16,
  },
  card: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  orderId: {
    fontWeight: '600',
    fontSize: 16,
  },
  orderTime: {
    color: 'gray',
    fontSize: 14,
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  statusItem: {
    alignItems: 'center',
    width: 70,
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  activeCircle: {
    backgroundColor: '#FF9900',
  },
  inactiveCircle: {
    backgroundColor: '#e0e0e0',
  },
  stepText: {
    fontSize: 11,
    color: 'gray',
    textAlign: 'center',
  },
  activeText: {
    color: '#FF9900',
    fontWeight: 'bold',
  },
  lineWrapper: {
    width: 50,
    alignItems: 'center',
    marginTop: -18,
  },
  solidLine: {
    height: 2,
    backgroundColor: '#FF9900',
    width: '100%',
  },
  dottedLine: {
    height: 2,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderRadius: 1,
    borderColor: 'gray',
    width: '100%',
  },
  inactiveLine: {
    backgroundColor: '#e0e0e0',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeNavButton: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF9900',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 80,
  },
});

export default OrderStatusScreen;