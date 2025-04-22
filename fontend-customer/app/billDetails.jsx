import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// โลโก้ร้าน (สมมติว่าอยู่ใน assets)
const logoImage = require('../assets/images/Bill.png');

export default function BillDetailsScreen() {
  const { orderId, tableId } = useLocalSearchParams(); // เพิ่ม tableId เพื่อส่งกลับไปหน้า Bills
  const router = useRouter();

  // ข้อมูลสมมติ (สามารถเปลี่ยนเป็นการดึงจาก API ได้)
  const billDetails = {
    orderId: orderId || '0514141545',
    restaurantName: 'MoonAroi',
    date: '15 Apr 2025 3:45 pm',
    table: 'Table 7',
    items: [
      { name: 'Veg Burger', quantity: 1, price: 50.00, amount: 50.00 },
      { name: 'Garlic bread', quantity: 1, price: 5.67, amount: 5.67 },
      { name: 'Pepsi', quantity: 1, price: 10.00, amount: 10.00 },
    ],
    subtotal: 31.69,
    vat: 2.31,
    total: 55.00,
  };

  // ฟังก์ชันสำหรับกดปุ่มย้อนกลับ
  const handleBackPress = () => {
    router.replace({
      pathname: '/(tabs)/bill',
      params: { tableId }, // ส่ง tableId กลับไปหน้า Bills
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* หัวข้อและปุ่มย้อนกลับ */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
      </View>

      {/* กล่องบิล */}
      <View style={styles.billContainer}>
        <View style={styles.header}>
          <Image source={logoImage} style={styles.logo} />
          <Text style={styles.restaurantName}>{billDetails.restaurantName}</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order:</Text>
            <Text style={styles.orderValue}>{billDetails.orderId}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{billDetails.date}</Text>
          </View>
          <Text style={styles.infoTable}>{billDetails.table}</Text>
        </View>

        {/* รายการอาหาร (รวม header และ items ในแถวเดียวกัน) */}
        <View style={styles.itemsContainer}>
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsHeaderText}>ITEM</Text>
            <Text style={styles.itemsHeaderTextQty}>QTY</Text>
            <Text style={styles.itemsHeaderTextPrice}>PRICE</Text>
            <Text style={styles.itemsHeaderTextAmount}>AMOUNT</Text>
          </View>
          {billDetails.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>฿{item.price.toFixed(2)}</Text>
              <Text style={styles.itemAmount}>฿{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>฿{billDetails.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VAT (7%)</Text>
            <Text style={styles.summaryValue}>฿{billDetails.vat.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>฿{billDetails.total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footerText}>----- Thank you and see you next time -----</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginRight: 35,
  },
  billContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 5,
  },
  orderLabel: {
    fontSize: 16,
    color: '#000',
  },
  orderValue: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 16,
    color: '#000',
  },
  infoTable: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: 5,
    paddingTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  itemsHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    width: '40%',
    textAlign: 'left',
  },
  itemsHeaderTextQty: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  itemsHeaderTextPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  itemsHeaderTextAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemName: {
    fontSize: 14,
    color: '#000',
    width: '40%',
    textAlign: 'left',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  itemAmount: {
    fontSize: 14,
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  summary: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#000',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
});