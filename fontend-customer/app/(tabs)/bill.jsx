import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, ActivityIndicator, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTable } from '../../contexts/TableContext';

const API_BASE_URL = 'http://172.20.10.3:3000';

export default function BillsScreen() {
  const { tableId } = useTable();
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [grandTotal, setGrandTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      if (!tableId) {
        setError('ไม่พบหมายเลขโต๊ะ');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/bills-summary/${tableId.padStart(2, '0')}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch bills');

        setBills(data.bills || []);
        setGrandTotal(data.grand_total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [tableId]);

  const handleBillPress = (orderId) => {
    router.push({
      pathname: '/billDetails',
      params: { orderId },
    });
  };

  const renderBill = ({ item }) => (
    <TouchableOpacity style={styles.billCard} onPress={() => handleBillPress(item.order_number)}>
      <View style={styles.iconContainer}>
        <Image source={require('../../assets/images/Bill.png')} style={styles.iconImage} resizeMode="contain" />
      </View>
      <View style={styles.billInfo}>
        <Text style={styles.orderText}>Order #{item.order_number}</Text>
        <Text style={styles.totalText}>
          Total: <Text style={{ color: 'orange' }}>฿{item.total}</Text>
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="gray" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bills</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF9900" />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      ) : (
        <>
          <ImageBackground source={require('../../assets/images/bgbill.png')} style={styles.totalCard} imageStyle={styles.totalCardImage}>
            <Text style={styles.totalLabel}>Total Receipts</Text>
            <Text style={styles.totalAmount}>฿{grandTotal}</Text>
          </ImageBackground>

          <Text style={styles.sectionTitle}>My Bills</Text>

          <FlatList
            data={bills}
            renderItem={renderBill}
            keyExtractor={(item) => item.order_number}
            contentContainerStyle={{ gap: 10 }}
          />
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 16,
  },
  totalCard: {
    height: 100,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCardImage: {
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#444',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  iconContainer: {
    backgroundColor: '#eee',
    borderRadius: 24,
    padding: 10,
    marginRight: 12,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  billInfo: {
    flex: 1,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalText: {
    marginTop: 4,
    fontSize: 14,
  },
});