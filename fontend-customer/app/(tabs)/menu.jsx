import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Image, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
// import { API_BASE_URL } from '@env';
const API_BASE_URL = 'http://172.20.10.3:3000';
import { useLocalSearchParams } from 'expo-router';
import { useTable } from '../../contexts/TableContext'; // ปรับ path ตามโครงสร้าง
console.log('API_BASE_URL Menu:', API_BASE_URL); // ✅ เพิ่มบรรทัดนี้


const MenuHomeScreen = () => {
  const { tableId, setTableId } = useTable();
  const { tableId: paramTableId } = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('Spicy Basil');
  const [displayedFoodItems, setDisplayedFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const categories = [
    'Spicy Basil',
    'Chili Stir-Fry',
    'Vegetable Dishes',
    'Saucy',
    'Fried & Eggs',
    'Curry & Soup',
    'Rice Dishes',
    'Noodles & Pasta',
    'Drinks',
    'Dessert',
  ];
  const navigation = useNavigation();

  useEffect(() => {
    const effectiveTableId = paramTableId || tableId || '01';
    setTableId(effectiveTableId);
    console.log('tableId in MenuHomeScreen:', effectiveTableId);
    if (!paramTableId) {
      console.warn('paramTableId is undefined, using fallback:', effectiveTableId);
    }
  }, [paramTableId, setTableId]);

  const tabs = [{ name: 'cart', icon: require('../../assets/images/basket.png') }];

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/menu?category=${encodeURIComponent(activeCategory)}`,
          { timeout: 5000 }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        setDisplayedFoodItems(data);
      } catch (error) {
        console.error('Error fetching menu items:', error.message);
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
        setDisplayedFoodItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, [activeCategory]);

  useEffect(() => {
    
  }, [displayedFoodItems]);

  const handleSearchChange = (text) => {
    setSearchText(text);
  };

  const handleCategoryPress = (category) => {
    setActiveCategory(category);
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.bar}>
          <Text style={styles.M}>Moom</Text>
          <Text style={styles.A}>Aroi</Text>
        </View>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.cartIconContainer}
            onPress={() => navigation.navigate('cart')}
          >
            <Image source={tab.icon} style={styles.cartIcon} resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.T}>
        <Text style={styles.Ta}>Table {tableId}</Text>
      </View>
      <View style={styles.search}>
        <View style={styles.searchC}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Food"
            onChangeText={handleSearchChange}
            value={searchText}
          />
          {searchText ? (
            <View style={styles.searchF}>
              <Text style={styles.searchFood}></Text>
            </View>
          ) : null}
          <Feather name="search" size={20} color="#868686" style={styles.searchIcon} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryItem, activeCategory === category && styles.activeCategoryItem]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={[styles.categoryText, activeCategory === category && styles.activeCategoryText]}>
                {category}
              </Text>
              {activeCategory === category && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF8A00" style={styles.loader} />
      ) : displayedFoodItems.length === 0 ? (
        <Text style={styles.noItemsText}>ไม่พบรายการอาหาร</Text>
      ) : (
        <FlatList
          data={displayedFoodItems}
          keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
          renderItem={({ item }) => {
            
            const imageUrl = item.image;
            return (
              <TouchableOpacity
                onPress={() => {
                  console.log('Navigating to menuDetails1 with tableId:', tableId);
                  navigation.navigate('menuDetails1', {
                    foodItemId: item.id,
                    foodItemImage: item.image,
                    foodItemName: item.name_eng,
                    tableId,
                  });
                }}
              >
                <View style={styles.foodItemCard}>
                  {item.image && typeof item.image === 'string' && item.image.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.foodItemImage}
                      onError={(error) =>
                        console.log('Image load error:', error.nativeEvent.error, 'URL:', imageUrl)
                      }
                    />
                  ) : (
                    <View style={[styles.foodItemImage, styles.placeholderImage]} />
                  )}
                  <View style={styles.foodItemDetails}>
                    <Text style={styles.foodItemName}>{item.name_eng || 'No Name'}</Text>
                    <Text style={styles.foodItemDescription}>{item.short_description || 'No Description'}</Text>
                    <Text style={styles.foodItemPrice}>฿{item.price_starts_at || 'N/A'}</Text>
                  </View>
                  <View style={styles.addToCartButton}>
                    <Text style={styles.addToCartText}>+</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingTop: 50, // เพิ่ม paddingTop จาก 10 เป็น 20 เพื่อให้ header ไม่ติดขอบบน
    paddingBottom: 10, // ลด paddingBottom จาก 23 เป็น 10 เพื่อให้ menubar ไม่เลื่อนลงมาก
  },
  bar: {
    flexDirection: 'row',
  },
  M: {
    fontFamily: 'IBM Plex Sans Thai Looped',
    fontSize: 24,
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  A: {
    fontFamily: 'IBM Plex Sans Thai Looped',
    fontSize: 24,
    color: '#FF8A00',
    fontWeight: 'bold',
  },
  T: {
    marginTop: 0,
  },
  Ta: {
    fontFamily: 'IBM Plex Sans Thai Looped',
    fontSize: 15,
    color: '#ABABAB',
  },
  search: {
    marginTop: 20,
  },
  searchC: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 55,
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 10,
    fontSize: 16,
  },
  searchF: {
    marginLeft: 10,
  },
  searchIcon: {},
  searchFood: {
    fontFamily: 'IBM Plex Sans Thai Looped',
    fontSize: 16,
    color: '#868686',
  },
  categoryScrollView: {
    marginTop: 10,
    paddingVertical: 3,
  },
  categoryItem: {
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCategoryItem: {},
  categoryText: {
    fontSize: 16,
    color: '#868686',
  },
  activeCategoryText: {
    color: '#FF8A00',
    fontWeight: 'bold',
  },
  activeIndicator: {
    height: 2,
    backgroundColor: '#FF8A00',
    width: '100%',
    marginTop: 3,
  },
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  foodItemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    backgroundColor: '#EFEFEF',
  },
  foodItemDetails: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2E33',
    marginBottom: 5,
    lineHeight: 22,
  },
  foodItemDescription: {
    fontSize: 13,
    color: '#868686',
  },
  foodItemPrice: {
    fontSize: 16,
    color: '#2A2E33',
    fontWeight: 'bold',
    marginTop: 8,
  },
  addToCartButton: {
    backgroundColor: '#FF8A00',
    width: 37,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 10,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  cartIconContainer: {
    padding: 3,
  },
  cartIcon: {
    width: 31,
    height: 31,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  loader: {
    marginTop: 20,
  },
  noItemsText: {
    fontSize: 16,
    color: '#868686',
    textAlign: 'center',
    marginTop: 20,
  },
  flatListContent: {
    paddingBottom: 45,
  },
});
export default MenuHomeScreen;