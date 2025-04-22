import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const AddToCartBar = ({ quantity, onIncrement, onDecrement, totalPrice, onAddToCart }) => {
  const [isMinusPressed, setIsMinusPressed] = useState(false);
  const [isPlusPressed, setIsPlusPressed] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={[styles.button, isMinusPressed && styles.buttonPressed]}
          onPressIn={() => setIsMinusPressed(true)}
          onPressOut={() => setIsMinusPressed(false)}
          onPress={onDecrement}
        >
          <Feather name="minus" size={20} color="#2A2E33" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantity}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f2f2f2' }, isPlusPressed && styles.buttonPressed]}
          onPressIn={() => setIsPlusPressed(true)}
          onPressOut={() => setIsPlusPressed(false)}
          onPress={onIncrement}
        >
          <Feather name="plus" size={20} color="#FF8A00" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCart}>
        <Text style={styles.addToCartText}>
          Add to cart  ฿{(typeof totalPrice === 'number' ? totalPrice : 0).toFixed(2)}
        </Text>



      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 25,
    backgroundColor: '#ffffff',
    bottom: 0,
    left: 0,
    right: 0,
    // marginBottom: -26,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#DDDDDD',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    
  },
  buttonPressed: {
    backgroundColor: '#FF8A00', // สีส้มเมื่อกด
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddToCartBar;