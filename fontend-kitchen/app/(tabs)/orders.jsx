import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // เปลี่ยนเป็น IP ถ้าใช้บนมือถือ

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/status`, { status: newStatus });
      // ดึงข้อมูลออเดอร์ใหม่ทั้งหมด
      await fetchOrders();
      // อัปเดต selectedOrder ถ้ายังเลือกอยู่
      const updatedOrder = orders.find(order => order.id === orderId);
      if (selectedOrder?.id === orderId && updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(`Failed to update status: ${err.message}`);
    }
  };

  const formatOrderDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString('en-CA');
    } catch {
      return 'N/A';
    }
  };

  const formatOrderTime = (date, time) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      if (time && /^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/.test(time)) {
        return new Date(`${date.split('T')[0]}T${time}`).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const renderOrderItem = ({ item }) => {
    console.log('Order item:', item);
    console.log('total_price type:', typeof item.total_price, 'value:', item.total_price);
    console.log('order_date:', item.order_date, 'order_time:', item.order_time);
    console.log('items:', JSON.stringify(item.items, null, 2));
    const totalPrice = typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price;
    const formattedPrice = !isNaN(totalPrice) ? totalPrice.toFixed(2) : '0.00';

    return (
      <TouchableOpacity
        style={[styles.orderItem, selectedOrder?.id === item.id && styles.selectedOrderItem]}
        onPress={() => setSelectedOrder(item)}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={[styles.orderStatus, getStatusColor(item.status)]}>{item.status}</Text>
        </View>
        <View style={styles.orderDetails}>
          <Text style={styles.orderTable}>Table {item.table_no}</Text>
          <Text style={styles.orderTime}>{formatOrderTime(item.order_date, item.order_time)}</Text>
          <Text style={styles.orderTotal}>฿{formattedPrice}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrderDetails = () => {
    if (!selectedOrder) {
      return <Text style={styles.noDetails}>No Order Details</Text>;
    }

    // ตรวจสอบ items
    const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeaderRow}>
          <Text style={styles.detailsTitle}>Order #{selectedOrder.id}</Text>
          <Text style={styles.detailsStatus}>{selectedOrder.status}</Text>
        </View>
        <View style={styles.detailsInfo}>
          <Text style={styles.detailsText}>Table {selectedOrder.table_no}</Text>
          <Text style={styles.detailsText}>Items: {items.length}</Text>
        </View>
        <View style={styles.detailsInfo}>
          <Text style={styles.detailsText}>Order Date: {formatOrderDate(selectedOrder.order_date)}</Text>
          <Text style={styles.detailsText}>
            Order Time: {formatOrderTime(selectedOrder.order_date, selectedOrder.order_time)}
          </Text>
        </View>
        <View style={styles.detailsItems}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
              const formattedItemPrice = !isNaN(itemPrice) ? itemPrice.toFixed(2) : '0.00';
              const imageUrl = item.menu_image
                ? `${API_BASE_URL}${item.menu_image.replace('/Uploads/', '/uploads/')}`
                : 'https://via.placeholder.com/50';
              console.log('Menu item:', item.menu_name, 'menu_image:', item.menu_image, 'imageUrl:', imageUrl);

              return (
                <View key={index} style={styles.itemRow}>
                  <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                  <Text style={styles.itemName}>
                    {item.menu_name} {item.meat ? `(${item.meat})` : ''} {item.add_on ? `+ ${item.add_on}` : ''}
                  </Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>฿{formattedItemPrice}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noDetails}>No items in this order</Text>
          )}
        </View>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[styles.statusButton, selectedOrder.status === 'Order Placed' && styles.activeButton]}
            onPress={() => updateOrderStatus(selectedOrder.id, 'Order Placed')}
          >
            <Text style={styles.statusButtonText}>Order Placed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, selectedOrder.status === 'Preparing' && styles.activeButton]}
            onPress={() => updateOrderStatus(selectedOrder.id, 'Preparing')}
          >
            <Text style={styles.statusButtonText}>Preparing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, styles.completeButton, selectedOrder.status === 'Complete' && styles.activeButton]}
            onPress={() => updateOrderStatus(selectedOrder.id, 'Complete')}
          >
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed':
        return styles.orderPlacedText;
      case 'Preparing':
        return styles.preparingText;
      case 'Complete':
        return styles.completeText;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Orders</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.content}>
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.orderList}
        />
        <View style={styles.detailsWrapper}>{renderOrderDetails()}</View>
      </View>
    </View>
  );
}

// styles เหมือนเดิม
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  content: {
    flexDirection: 'row',
    height: '90%',
  },
  orderList: {
    flex: 1,
    paddingRight: 10,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  selectedOrderItem: {
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTable: {
    fontSize: 14,
    color: '#666',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  detailsWrapper: {
    flex: 1,
    paddingLeft: 10,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    height: '100%',
    elevation: 2,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  detailsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
  },
  detailsItems: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  noDetails: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  orderPlacedText: { color: '#007bff' },
  preparingText: { color: '#ff9800' },
  completeText: { color: '#4caf50' },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  statusButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#000',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  activeButton: {
    backgroundColor: '#d0d0d0',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});