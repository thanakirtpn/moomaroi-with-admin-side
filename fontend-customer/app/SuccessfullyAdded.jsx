import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

const SuccessfullyAdded = () => {
  const router = useRouter(); 

  useEffect(() => {
    console.log('SuccessfullyAdded mounted, returning to /tabs/menu in 2 seconds');
    const timer = setTimeout(() => {
      console.log('Returning to /tabs/menu');
      router.push('/(tabs)/menu'); 
    }, 2000);
    
    return () => {
      console.log('SuccessfullyAdded unmounted, clearing timer');
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/Suc.png')}
          style={styles.itemImage}
          resizeMode="contain"
        />
        <Text style={styles.text}>Successfully added!</Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 3,
    marginBottom: 20,
  },
  itemImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
});

export default SuccessfullyAdded;