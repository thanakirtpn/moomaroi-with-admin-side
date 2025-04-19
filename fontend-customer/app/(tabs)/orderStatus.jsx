import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function OrderStatusScreen() {
  const { tableId } = useLocalSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log('Table ID in OrderStatusScreen:', tableId);

  const fetchOrders = async () => {
    if (!tableId) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลโต๊ะ');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.40:3000/api/orders');
      const data = await response.json();
      console.log('Fetched orders:', data);
      const filteredOrders = data.filter((order) => order.tableId === tableId);
      console.log('Filtered orders:', filteredOrders);
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลออเดอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // Fetch เฉพาะเมื่อหน้าโหลดครั้งแรก
  useEffect(() => {
    fetchOrders();
  }, [tableId]); // ลบ setInterval ออก

  const renderOrder = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderText}>
        สั่ง: {item.menuItem} (สถานะ: {item.status})
      </Text>
      <Text style={styles.timestamp}>
        เวลา: {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ออเดอร์ของโต๊ะ: {tableId || 'ไม่ระบุ'}</Text>
      <Button title="รีเฟรช" onPress={fetchOrders} />
      {loading ? (
        <Text>กำลังโหลด...</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีออเดอร์</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  orderItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  orderText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});