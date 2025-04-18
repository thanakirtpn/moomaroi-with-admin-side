import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname, Slot } from 'expo-router';
import { useState } from 'react';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const handleLogout = () => {
    alert('Logged out!');
  };

  const getIconStyle = (iconName, route) => ({
    color: hoveredIcon === iconName || pathname === route ? '#000' : '#fff',
    backgroundColor: hoveredIcon === iconName || pathname === route ? '#ff9800' : 'transparent',
  });

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={[styles.navItem, getIconStyle('orders', '/(tabs)/orders')]}
          onPress={() => router.push('/(tabs)/orders')}
          onPressIn={() => setHoveredIcon('orders')}
          onPressOut={() => setHoveredIcon(null)}
        >
          <FontAwesome
            name="list"
            size={24}
            color={hoveredIcon === 'orders' || pathname === '/(tabs)/orders' ? '#000' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, getIconStyle('reserve', '/(tabs)/Tablescreen')]}
          onPress={() => router.push('/(tabs)/Tablescreen')}
          onPressIn={() => setHoveredIcon('Tablescreen')}
          onPressOut={() => setHoveredIcon(null)}
        >
          <FontAwesome
            name="calendar"
            size={24}
            color={hoveredIcon === 'reserve' || pathname === '/(tabs)/reserve' ? '#000' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, getIconStyle('menu', '/(tabs)/menu')]}
          onPress={() => router.push('/(tabs)/menu')}
          onPressIn={() => setHoveredIcon('menu')}
          onPressOut={() => setHoveredIcon(null)}
        >
          <FontAwesome
            name="edit"
            size={24}
            color={hoveredIcon === 'menu' || pathname === '/(tabs)/menu' ? '#000' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, getIconStyle('finance', '/(tabs)/finance')]}
          onPress={() => router.push('/(tabs)/finance')}
          onPressIn={() => setHoveredIcon('finance')}
          onPressOut={() => setHoveredIcon(null)}
        >
          <FontAwesome
            name="money"
            size={24}
            color={hoveredIcon === 'finance' || pathname === '/(tabs)/finance' ? '#000' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logoutButton, getIconStyle('logout', null)]}
          onPress={handleLogout}
          onPressIn={() => setHoveredIcon('logout')}
          onPressOut={() => setHoveredIcon(null)}
        >
          <FontAwesome
            name="sign-out"
            size={24}
            color={hoveredIcon === 'logout' ? '#000' : '#fff'}
          />
        </TouchableOpacity>
      </View>
      <Slot style={styles.content} /> {/* ใช้ Slot เพื่อเรนเดอร์หน้า Orders */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  navBar: {
    width: 80,
    backgroundColor: '#2f2f2f',
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
    justifyContent: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});