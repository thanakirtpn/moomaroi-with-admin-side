import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BillsScreen() {
  const router = useRouter();

  const handleBillPress = (orderId) => {
    router.push({
      pathname: '/billDetails',
      params: { orderId },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bills</Text>

      {/* Total Receipts Card with background image */}
      <ImageBackground
        source={require('../../assets/images/Bill.png')}
        style={styles.totalCard}
        imageStyle={styles.totalCardImage}
      >
        <Text style={styles.totalLabel}>Total Receipts</Text>
        <Text style={styles.totalAmount}>฿105.00</Text>
      </ImageBackground>

      {/* My Bills Section */}
      <Text style={styles.sectionTitle}>My Bills</Text>

      {/* Single Bill Card */}
      <TouchableOpacity
        style={styles.billCard}
        onPress={() => handleBillPress('0514141545')} // เพิ่มการนำทาง
      >
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/images/Bill.png')}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.billInfo}>
          <Text style={styles.orderText}>Order #0514141545</Text>
          <Text style={styles.totalText}>Total: <Text style={{ color: 'orange' }}>฿55.00</Text></Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="gray" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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