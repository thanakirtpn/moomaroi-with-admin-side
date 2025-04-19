import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [subtitles, setSubtitles] = useState('');
  const [category, setCategory] = useState('Spicy Stir-fried Dishes');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const fileInputRef = useRef(null);

  const BASE_URL = 'http://localhost:3000';

  const categories = [
    'All Categories',
    'Hot Dishes',
    'Cold Dishes',
    'Soup',
    'Grill',
    'Appetizer',
    'Dessert',
  ];

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const fetchMenuItems = async () => {
    try {
      const url = selectedCategory && selectedCategory !== 'All Categories'
        ? `${BASE_URL}/api/menu?category=${encodeURIComponent(selectedCategory)}`
        : `${BASE_URL}/api/menu`;
      console.log('Fetching menu from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items from server');
      }
      const data = await response.json();
      console.log('Fetched menu items:', data);
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      Alert.alert('Error', `Failed to fetch menu items: ${error.message}`);
    }
  };

  const pickImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage({
          uri: reader.result,
          type: file.type,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderMenuItem = ({ item }) => {
    const basePrice = parseFloat(item.base_price);
    const displayPrice = isNaN(basePrice) ? '0.00' : basePrice.toFixed(2);

    return (
      <View style={styles.menuItem}>
        {item.image ? (
          <Image source={{ uri: `${BASE_URL}${item.image}` }} style={styles.menuImage} />
        ) : (
          <View style={styles.menuImagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuPrice}>฿{displayPrice}</Text>
        <Text style={styles.menuOrders}>{item.orders} order</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Menu</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleAddFood = async () => {
    let missingFields = [];
    if (!foodName) missingFields.push('Food name');
    if (!category) missingFields.push('Food Category');
    if (!price) missingFields.push('Price');
    if (!image) missingFields.push('Image');

    if (missingFields.length > 0) {
      Alert.alert('Error', `Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Price must be a valid positive number');
      return;
    }

    const formData = new FormData();
    formData.append('name', foodName);
    formData.append('subtitle', subtitles);
    formData.append('category', category);
    formData.append('basePrice', priceNum.toString());
    formData.append('description', description);

    if (image) {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      formData.append('image', blob, image.name);
    }

    try {
      const response = await fetch(`${BASE_URL}/api/menu`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error occurred');
      }

      const newItem = await response.json();
      if (!selectedCategory || selectedCategory === 'All Categories' || newItem.category === selectedCategory) {
        setMenuItems([...menuItems, newItem]);
      }
      Alert.alert('Success', `Menu item "${newItem.name}" has been added successfully!`);

      setModalVisible(false);
      setFoodName('');
      setSubtitles('');
      setCategory('Spicy Stir-fried Dishes');
      setPrice('');
      setDescription('');
      setImage(null);
    } catch (error) {
      console.error('Error adding menu item:', error);
      let errorMessage = 'Failed to add menu item';
      if (error.message.includes('Missing required fields')) {
        errorMessage = 'Failed to add menu item: Missing required fields on the server';
      } else if (error.message.includes('Only JPEG, JPG, and PNG files are allowed')) {
        errorMessage = 'Failed to add menu item: Only JPEG, JPG, and PNG images are allowed';
      } else if (error.message.includes('File too large')) {
        errorMessage = 'Failed to add menu item: Image size exceeds 5MB limit';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('Network Error')) {
        errorMessage = 'Failed to add menu item: Unable to connect to the server. Please check if the backend is running';
      } else {
        errorMessage = `Failed to add menu item: ${error.message}`;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Menu</Text>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, selectedCategory === cat ? styles.activeCategory : null]}
              onPress={() => {
                console.log('Selected category:', cat); // Debug การเลือกหมวดหมู่
                setSelectedCategory(cat);
              }}
            >
              <Text style={[styles.categoryText, selectedCategory === cat ? styles.activeCategoryText : null]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food, drink, etc..."
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>Add New Food</Text>
          </TouchableOpacity>
        </View>
      </View>
      {menuItems.length === 0 ? (
        <Text style={styles.emptyText}>
          {selectedCategory && selectedCategory !== 'All Categories'
            ? `No menu items available in ${selectedCategory}. Add a new item!`
            : 'No menu items available. Add a new item!'}
        </Text>
      ) : (
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.menuRow}
          style={styles.menuList}
        />
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Food</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>X</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.uploadImage} />
              ) : (
                <Text style={styles.uploadText}>Click to upload</Text>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
              />
            </TouchableOpacity>
            <Text style={styles.formLabel}>Food name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Fried rice with pineapple"
              value={foodName}
              onChangeText={setFoodName}
            />
            <Text style={styles.formLabel}>Subtitles</Text>
            <TextInput
              style={styles.formInput}
              placeholder="with meat"
              value={subtitles}
              onChangeText={setSubtitles}
            />
            <Text style={styles.formLabel}>Food Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                style={styles.picker}
                onValueChange={(itemValue) => setCategory(itemValue)}
              >
                <Picker.Item label="Spicy Stir-fried Dishes" value="Spicy Stir-fried Dishes" />
                <Picker.Item label="Hot Dishes" value="Hot Dishes" />
                <Picker.Item label="Cold Dishes" value="Cold Dishes" />
                <Picker.Item label="Soup" value="Soup" />
                <Picker.Item label="Grill" value="Grill" />
                <Picker.Item label="Appetizer" value="Appetizer" />
                <Picker.Item label="Dessert" value="Dessert" />
              </Picker>
            </View>
            <Text style={styles.formLabel}>Price starts at</Text>
            <TextInput
              style={styles.formInput}
              placeholder="50.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.descriptionInput]}
              placeholder="A flavorful Thai dish combining minced meat, holy basil, garlic, chili, and served with rice and egg, topped with a crispy food"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleAddFood}>
              <Text style={styles.submitButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  filterRow: {
    marginBottom: 10,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategory: {
    backgroundColor: '#ff9800',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
  },
  activeCategoryText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  menuList: {
    flex: 1,
  },
  menuRow: {
    justifyContent: 'space-between',
  },
  menuItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    alignItems: 'center',
  },
  menuImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  menuName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
    marginVertical: 5,
  },
  menuOrders: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 18,
    color: '#ff0000',
  },
  uploadContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
  },
  uploadImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});