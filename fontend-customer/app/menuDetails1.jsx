import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import MeatAndAddOnSelection from './meatAndAddOnSelection';
import AddToCartBar from './AddToCartBar';
// import { API_BASE_URL } from '@env';
const API_BASE_URL = 'http://172.20.10.3:3000';
import { useTable } from '../contexts/TableContext'; // ปรับ path ตามโครงสร้าง
console.log(API_BASE_URL); // http://192.168.1.4:3000
const menuDetails1 = () => {
  const { tableId } = useTable();
  const { foodItemId, foodItemName, foodItemImage } = useLocalSearchParams();
  const navigation = useNavigation();
  const [foodItem, setFoodItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [quantity, setQuantity] = useState(1);
  const [selectedMeat, setSelectedMeat] = useState(null);
  const [selectedMeatPrice, setSelectedMeatPrice] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedAddOnPrice, setSelectedAddOnPrice] = useState(0);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
  const [totalPrice, setTotalPrice] = useState(100);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    console.log('tableId in menuDetails1:', tableId);
    if (!tableId) {
      console.warn('tableId is undefined in menuDetails1');
    }
  }, [tableId]);

  const fetchFoodItem = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!foodItemId || typeof foodItemId !== 'string' || foodItemId.trim() === '') {
      setError('ไม่พบ ID ของเมนู');
      setLoading(false);
      return;
    }

    let url = `${API_BASE_URL}/api/menu/${foodItemId}`;
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || Object.keys(data).length === 0) {
        throw new Error('ไม่พบข้อมูลเมนู');
      }
      setFoodItem(data);
      setTotalPrice(data.price_starts_at || 100);
    } catch (err) {
      console.error('Error fetching food item:', err);
      setError('ไม่สามารถโหลดข้อมูลเมนูได้');
      setFoodItem(null);
    } finally {
      setLoading(false);
    }
  }, [foodItemId]);

  useEffect(() => {
    fetchFoodItem();
  }, [fetchFoodItem]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleSizeSelect = useCallback((size) => setSelectedSize(size), []);
  const handleMeatSelect = useCallback((meat, price) => {
    console.log('Selected meat:', meat, 'Price:', price);
    setSelectedMeat(meat);
    setSelectedMeatPrice(price);
  }, []);

  const handleAddOnSelect = useCallback((addOns, price, addOnIds) => {
    console.log('Selected addOns:', addOns, 'Price:', price, 'IDs:', addOnIds);
    setSelectedAddOns(addOns);
    setSelectedAddOnPrice(price);
    setSelectedAddOnIds(addOnIds);
  }, []);

  const incrementQuantity = useCallback(() => setQuantity((prev) => prev + 1), []);
  const decrementQuantity = useCallback(() => setQuantity((prev) => (prev > 1 ? prev - 1 : prev)), []);

  const handleAddToCart = useCallback(async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);

    if (!tableId) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบหมายเลขโต๊ะ กรุณากลับไปหน้าเมนู');
      navigation.navigate('menu');
      setIsAddingToCart(false);
      return;
    }
    if (!foodItem) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลเมนู');
      setIsAddingToCart(false);
      return;
    }

    const price_each =
      (parseFloat(foodItem.price_starts_at) || 100) +
      (selectedSize === 'Extra' ? 20 : 0) +
      selectedMeatPrice +
      selectedAddOnPrice;

    const payload = {
      table_no: tableId.padStart(2, '0'),
      menu_id: foodItemId,
      meat_option_id: selectedMeat?.id || null,
      quantity,
      addon_option_ids: selectedAddOnIds || [],
    };

    try {
      console.log('Sending payload to API:', JSON.stringify(payload, null, 2));
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 5000,
      });

      const data = await response.json();
      console.log('API response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถเพิ่มลงตะกร้าได้');
      }

      console.log('Navigating to SuccessfullyAdded with totalPrice:', totalPrice);
      navigation.navigate('SuccessfullyAdded', {
        foodItemId,
        foodItemName,
        foodItemImage,
        tableId,
        totalPrice,
      });
    } catch (err) {
      console.error('Error adding to cart:', err.message, err.stack);
      Alert.alert('ข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    isAddingToCart,
    tableId,
    foodItem,
    foodItemId,
    foodItemName,
    foodItemImage,
    selectedSize,
    selectedMeat,
    selectedMeatPrice,
    selectedAddOnPrice,
    selectedAddOnIds,
    quantity,
    totalPrice,
    navigation,
  ]);

  useEffect(() => {
    if (!foodItem) return;

    const basePrice = parseFloat(foodItem.price_starts_at) || 100;
    const extraSizePrice = selectedSize === 'Extra' ? 20 : 0;
    const calculatedTotalPrice = basePrice + extraSizePrice + selectedMeatPrice + selectedAddOnPrice;

    const total = Math.round(calculatedTotalPrice * quantity * 100) / 100;

    if (total !== totalPrice) {
      setTotalPrice(total);
    }
  }, [foodItem, selectedSize, selectedMeatPrice, selectedAddOnPrice, quantity, totalPrice]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8A00" />
      </View>
    );
  }

  const imageUrl = foodItem?.image || foodItemImage || '';

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Feather name="chevron-left" size={30} color="#2A2E33" />
        </TouchableOpacity>
        <View style={styles.md}>
          <Text style={styles.me}>Menu</Text>
          <Text style={styles.d}>Details</Text>
        </View>
      </View>

      <ScrollView style={styles.menu} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imgDetails}>
          {imageError || !imageUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
            <View style={[styles.foodDetailImage, styles.placeholderImage]}>
              <Text style={styles.errorText}>ไม่สามารถโหลดรูปภาพได้</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.foodDetailImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )}
        </View>

        <View style={styles.nameOrder}>
          <View style={styles.nameD}>
            <Text style={styles.foodItemName}>{foodItem?.name_eng || foodItemName || 'ไม่มีชื่อ'}</Text>
            <View style={styles.orderd}>
              <Text style={styles.buy}>100</Text>
              <Text style={styles.order}>order</Text>
            </View>
          </View>
        </View>

        <View style={styles.wmd}>
          <Text style={styles.shortDescription}>
            {foodItem?.short_description || 'ไม่มีคำอธิบายสั้น'}
          </Text>
        </View>

        <View style={styles.separator} />

        <View>
          <View style={styles.descdetils}>
            <Text style={styles.des}>Description</Text>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {foodItem?.full_description || 'ไม่มีคำอธิบาย'}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.sizeContainer}>
          <Text style={styles.sizeTitle}>Size</Text>
          <View style={styles.sizeButtons}>
            <TouchableOpacity
              style={[styles.sizeButton, selectedSize === 'Regular' && styles.selectedSizeButton]}
              onPress={() => handleSizeSelect('Regular')}
            >
              <Text style={[styles.sizeButtonText, selectedSize === 'Regular' && styles.selectedSizeText]}>
                Regular
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sizeButton, selectedSize === 'Extra' && styles.selectedSizeButton]}
              onPress={() => handleSizeSelect('Extra')}
            >
              <Text style={[styles.sizeButtonText, selectedSize === 'Extra' && styles.selectedSizeText]}>
                Extra
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        <MeatAndAddOnSelection onMeatSelect={handleMeatSelect} onAddOnSelect={handleAddOnSelect} />
      </ScrollView>

      <AddToCartBar
        quantity={quantity}
        onIncrement={incrementQuantity}
        onDecrement={decrementQuantity}
        totalPrice={totalPrice}
        onAddToCart={handleAddToCart}
        disabled={isAddingToCart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50, // เพิ่มตรงนี้เพื่อให้หลบกล้อง
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,    
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    zIndex: 10,
  },
  menu: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
  },
  md: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  me: {
    fontSize: 20,
    color: '#2A2E33',
    fontWeight: 'bold',
    marginRight: 5,
  },
  d: {
    fontSize: 20,
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  imgDetails: {
    alignItems: 'center',
    marginTop: 10,
  },
  foodDetailImage: {
    width: '95%',
    height: 250,
    borderRadius: 20,
  },
  placeholderImage: {
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
  },
  nameOrder: {},
  nameD: {
    flexDirection: 'row',
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  foodItemName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderd: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginLeft: 185,
  },
  buy: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2E33',
    marginRight: 5,
  },
  order: {
    fontSize: 16,
    color: '#ABABAB',
  },
  wmd: {
    padding: 11,
    marginTop: -16,
  },
  shortDescription: {
    fontSize: 18,
    color: '#ABABAB',
  },
  separator: {
    height: 2,
    backgroundColor: '#EAEAEA',
    marginVertical: 10,
    width: '95%',
    alignSelf: 'center',
  },
  descdetils: {
    padding: 5,
    flexDirection: 'row',
    marginTop: -8,
  },
  des: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  descriptionText: {
    padding: 7,
    fontSize: 14,
    color: '#2A2E33',
    lineHeight: 20,
  },
  sizeContainer: {
    padding: 15,
  },
  sizeTitle: {
    marginTop: -10,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginRight: 80,
  },
  sizeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2E33',
    paddingVertical: 8,
    paddingHorizontal: 50,
    marginRight: 10,
  },
  selectedSizeButton: {
    borderColor: '#FF8A00',
    backgroundColor: '#FFE0B2',
  },
  sizeButtonText: {
    fontSize: 16,
    color: '#2A2E33',
  },
  selectedSizeText: {
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default menuDetails1;