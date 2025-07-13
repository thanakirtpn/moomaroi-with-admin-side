
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTable } from '../contexts/TableContext';
// import { API_BASE_URL } from '@env';
const API_BASE_URL = 'http://172.20.10.3:3000';

console.log(API_BASE_URL); // http://192.168.1.4:3000

const CartScreen = () => {
  const navigation = useNavigation();
  const { tableId } = useTable();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      if (!tableId) {
        setError('Table number not found.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/cart/${tableId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch cart.');
        }

        const formattedItems = data.items.map(item => ({
          id: item.cart_item_id,
          name: item.menu_name,
          variant: item.meat_option || item.addons || 'No option',
          price: item.total_price / item.quantity,
          quantity: item.quantity,
          image: item.image ? { uri: `${API_BASE_URL}${item.image}` } : require('../assets/images/Menuitem.png'),
        }));

        setCartItems(formattedItems);
        setError(null);
      } catch (err) {
        console.error('Fetch cart error:', err);
        setError(err.message || 'Failed to fetch cart.');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [tableId]);

  const handleIncrement = async (itemId) => {
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + 1;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_item_id: itemId, quantity: newQuantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update quantity.');
      }

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity, price: data.total_price / newQuantity }
            : item
        )
      );
    } catch (err) {
      console.error('Increment error:', err);
      Alert.alert('Error', err.message || 'Failed to update quantity.', [{ text: 'OK' }]);
    }
  };

  const handleDecrement = async (itemId) => {
    const item = cartItems.find(item => item.id === itemId);
    if (!item || item.quantity <= 1) return;

    const newQuantity = item.quantity - 1;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_item_id: itemId, quantity: newQuantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update quantity.');
      }

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity, price: data.total_price / newQuantity }
            : item
        )
      );
    } catch (err) {
      console.error('Decrement error:', err);
      Alert.alert('Error', err.message || 'Failed to update quantity.', [{ text: 'OK' }]);
    }
  };

  const handleDelete = async (itemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/cart/item/${itemId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove item.');
              }

              setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', err.message || 'Failed to remove item.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (!tableId) {
      Alert.alert('Error', 'Table number not found.', [{ text: 'OK' }]);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Cart is empty.', [{ text: 'OK' }]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_no: tableId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to checkout.');
      }

      // ล้าง cartItems หลังจาก checkout สำเร็จ
      setCartItems([]);

      // นำทางไปหน้า SuccessfullyAdded โดยตรง
      navigation.navigate('SuccessfullyAdded', {
        orderId: data.order_id,
        totalPrice: data.total_price,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to checkout.', [{ text: 'OK' }]);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="large" color="#FF8A00" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Feather name="chevron-left" size={30} color="#2A2E33" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Feather name="chevron-left" size={30} color="#2A2E33" />
        </TouchableOpacity>
        <View style={styles.yfl}>
          <Text style={styles.y}>Your</Text>
          <Text style={styles.f}>Food</Text>
          <Text style={styles.l}>List</Text>
        </View>
      </View>

      {cartItems.map((item, index) => (
        <View key={`${item.id}_${index}`} style={styles.itemContainer}>
          <Image source={item.image} style={styles.image} />
          <View style={styles.itemDetails}>
            <View style={styles.nameAndVariant}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.variant}>{item.variant || ' '}</Text>
              <Text style={styles.price}>฿{item.price.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
            <FontAwesome name="trash-o" size={20} color="#FF8A00" />
          </TouchableOpacity>
          <View style={styles.quantityControl}>
            <TouchableOpacity style={[styles.quantityButton, styles.decrementButton]} onPress={() => handleDecrement(item.id)}>
              <Text style={styles.quantityButtonText1}>-</Text>
            </TouchableOpacity>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantity}>{item.quantity || 0}</Text>
            </View>
            <TouchableOpacity style={[styles.quantityButton, styles.incrementButton]} onPress={() => handleIncrement(item.id)}>
              <Text style={styles.quantityButtonText2}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.bottomSection}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalPrice}>฿{calculateTotalPrice()}</Text>
        </View>
        <View style={styles.bottomSection2} />
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  section: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 23,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 10,
  },
  yfl: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
  },
  y: {
    fontSize: 20,
    color: '#2A2E33',
    fontWeight: 'bold',
    marginRight: 5,
  },
  f: {
    fontSize: 20,
    color: '#2A2E33',
    fontWeight: 'bold',
    marginRight: 5,
  },
  l: {
    fontSize: 20,
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    position: 'relative',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  nameAndVariant: {
    flexShrink: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2E33',
    marginBottom: 12,
  },
  variant: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 2,
    padding: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
    marginLeft: 5,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  quantityButtonText1: {
    color: '#2A2E33',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityButtonText2: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 15,
  },
  quantity: {
    fontSize: 16,
    color: '#2A2E33',
  },
  decrementButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 5,
  },
  incrementButton: {
    backgroundColor: '#FF8A00',
    marginLeft: 5,
  },
  bottomSection: {
    padding: 1,
    borderTopWidth: 1,
    borderColor: '#ffffff',
    marginTop: 30,
  },
  bottomSection2: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2E33',
  },
  checkoutButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
});
