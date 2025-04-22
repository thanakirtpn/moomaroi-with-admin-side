import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL } from '@env';
console.log(API_BASE_URL); // http://192.168.1.4:3000

const OrderDetailsScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { tableId, orderNumber } = params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!tableId || !orderNumber) {
      console.error('[OrderDetails] Missing tableId or orderNumber:', { tableId, orderNumber });
      setError('ไม่พบหมายเลขโต๊ะหรือหมายเลขคำสั่งซื้อ');
      setLoading(false);
      return;
    }

    console.log('[OrderDetails] Fetching order for:', { tableId, orderNumber });
    setLoading(true);
    setError(null);
    setOrder(null); // Reset order state

    try {
      const url = `${API_BASE_URL}/api/order/${tableId.padStart(2, '0')}?order_number=${encodeURIComponent(orderNumber)}`;
      console.log('[OrderDetails] API URL:', url);
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        timeout: 5000,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[OrderDetails] API response:', JSON.stringify(data, null, 2));
      setOrder(data);
    } catch (err) {
      console.error('[OrderDetails] Error fetching order details:', err);
      setError(err.message || 'ไม่สามารถดึงรายละเอียดคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  }, [tableId, orderNumber]);

  useEffect(() => {
    console.log('[OrderDetails] useEffect triggered with:', { tableId, orderNumber });
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleGoBack = () => {
    router.back();
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Image
        source={item.image ? { uri: item.image } : require('../assets/images/Menuitem.png')}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <View style={styles.itemNameRow}>
          <View style={styles.itemNameWrapper}>
            <Text style={styles.itemName}>{item.menu_name}</Text>
            {item.meat_option && <Text style={styles.itemType}>{item.meat_option}</Text>}
            {item.addons && <Text style={styles.itemType}>{item.addons}</Text>}
          </View>
          <View style={styles.quantityPriceRow}>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>฿{item.total_price}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
            <Text style={styles.retryButtonText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ไม่พบคำสั่งซื้อ</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Order Details</Text>
      </View>

      <View style={styles.statusWrapper}>
        <View style={styles.statusItem}>
          <View style={[styles.iconCircle, styles.activeCircle]}>
            <MaterialIcons name="receipt-long" size={20} color="white" />
          </View>
          <Text style={[styles.stepText, styles.activeText]}>Order Placed</Text>
        </View>
        <View style={styles.lineWrapper}>
          <View style={[styles.solidLine, order.status === 'Order Placed' && styles.inactiveLine]} />
        </View>
        <View style={styles.statusItem}>
          <View
            style={[
              styles.iconCircle,
              order.status === 'Preparing' || order.status === 'Complete'
                ? styles.activeCircle
                : styles.inactiveCircle,
            ]}
          >
            <MaterialIcons
              name="restaurant"
              size={20}
              color={order.status === 'Preparing' || order.status === 'Complete' ? 'white' : 'gray'}
            />
          </View>
          <Text
            style={[
              styles.stepText,
              order.status === 'Preparing' || order.status === 'Complete' ? styles.activeText : {},
            ]}
          >
            Preparing
          </Text>
        </View>
        <View style={styles.lineWrapper}>
          <View style={[styles.dottedLine, order.status === 'Complete' ? styles.solidLine : {}]} />
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.iconCircle, order.status === 'Complete' ? styles.activeCircle : styles.inactiveCircle]}>
            <MaterialIcons
              name="emoji-food-beverage"
              size={20}
              color={order.status === 'Complete' ? 'white' : 'gray'}
            />
          </View>
          <Text style={[styles.stepText, order.status === 'Complete' ? styles.activeText : {}]}>Complete</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailsContainer}>
        <Text style={styles.restaurantName}>MoomAroi</Text>
        <Text style={styles.table}>Table {order.table_no || 'N/A'}</Text>
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Order:</Text>
          <Text style={styles.infoValue}>{order.order_number || 'N/A'}</Text>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Order Date:</Text>
          <Text style={styles.infoValue}>{order.order_date || 'N/A'}</Text>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{order.order_time || 'N/A'}</Text>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Total:</Text>
          <Text style={styles.infoValue}>฿{order.grand_total || '0'}</Text>
        </View>

        <Text style={styles.ordersHeader}>Orders</Text>
        {order.items && order.items.length > 0 ? (
          <FlatList
            data={order.items}
            renderItem={renderOrderItem}
            keyExtractor={(item, index) => `${item.menu_name}-${index}`}
            contentContainerStyle={styles.itemsList}
          />
        ) : (
          <Text style={styles.noItems}>No items found</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
    paddingHorizontal: 16,
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
  separator: {
    height: 10,
    backgroundColor: '#e0e0e0',
  },
  detailsContainer: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9900',
    textAlign: 'center',
    marginBottom: 5,
  },
  table: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ordersHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 2,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNameWrapper: {
    flexDirection: 'column',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9900',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
  },
  noItems: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  itemsList: {
    paddingBottom: 20,
  },
});

export default OrderDetailsScreen;