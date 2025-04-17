import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function MenuScreen() {
  const { tableId } = useLocalSearchParams();
  const [selectedMenu, setSelectedMenu] = useState(null);

  console.log('Table ID in MenuScreen:', tableId);

  const menuItems = ['กระเพราหมูกรอบ', 'ข้าวผัด', 'ต้มยำกุ้ง'];

  const handleOrder = async () => {
    if (!selectedMenu) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาเลือกเมนู');
      return;
    }

    try {
      const response = await fetch('http://192.168.1.40:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: tableId || 'ไม่ระบุ',
          menuItem: selectedMenu,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send order');
      }

      Alert.alert('สำเร็จ', 'ส่งออเดอร์เรียบร้อยแล้ว');
      setSelectedMenu(null);
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถส่งออเดอร์ได้');
      console.error('Error sending order:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>เมนูอาหารสำหรับโต๊ะ: {tableId || 'ไม่ระบุ'}</Text>
      <Text style={styles.subtitle}>เลือกเมนู:</Text>
      {menuItems.map((item) => (
        <Button
          key={item}
          title={item}
          onPress={() => setSelectedMenu(item)}
          color={selectedMenu === item ? '#ff6347' : '#007bff'}
        />
      ))}
      <View style={styles.orderButton}>
        <Button title="ส่งออเดอร์" onPress={handleOrder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  orderButton: {
    marginTop: 20,
  },
});