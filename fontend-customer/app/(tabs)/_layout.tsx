import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
// import { API_BASE_URL } from '@env';
// console.log('API_BASE_URL', API_BASE_URL);
export default function TabsLayout() {
  const { tableId } = useLocalSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('menu');

  console.log('Table ID in TabsLayout:', tableId);
  const handleTabPress = (tabName:string) => {
    setActiveTab(tabName);
  };

  const tabs = [
    { name: 'menu', icon: require('../../assets/images/Menu2.png'), label: 'Menu' },
    { name: 'orderStatus', icon: require('../../assets/images/Order.png'), label: 'Order' },
    { name: 'help', icon: require('../../assets/images/ques2.png'), label: 'Help' },
    { name: 'bill', icon: require('../../assets/images/bill2.png'), label: 'Bill' },
  ];

  useEffect(() => {
    if (pathname === '/(tabs)/menu') {
      setActiveTab('menu');
    } else if (pathname === '/(tabs)/help') {
      setActiveTab('help');
    } else if (pathname === '/(tabs)/orderStatus') {
      setActiveTab('orderStatus');
    } else if (pathname === '/(tabs)/bill') {
      setActiveTab('bill');
    }
  }, [pathname]);

  return (
    <Tabs
      initialRouteName="menu"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // ซ่อน Label เริ่มต้นของ Expo Router
      }}
      tabBar={(props) => (
        <View style={styles.TabBar}>
          <View style={styles.customTabBar}>
            {props.navigation.getState().routes.map((route, index) => {
              const tab = tabs.find((t) => t.name === route.name);
              const isActive = activeTab === route.name;

              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.customTabItem}
                  onPress={() => {
                    props.navigation.navigate(route.name);
                    handleTabPress(route.name);
                  }}
                >
                  {isActive && tab?.label && tab?.icon && (
                    <View style={styles.activeTabContainer}>
                      <Image
                        source={tab.icon}
                        style={[styles.activeTabIcon, { marginRight: 5 }]}
                        resizeMode="contain"
                      />
                      <Text style={styles.activeTabText}>{tab.label}</Text>
                    </View>
                  )}
                  {!isActive && tab?.label && tab?.icon && (
                    <View style={styles.inactiveTabContainer}>
                      <Image
                        source={tab.icon}
                        style={styles.inactiveTabIcon}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  {!isActive && !tab?.label && tab?.icon && (
                    <View style={styles.inactiveTabContainer}>
                      <Image
                        source={tab.icon}
                        style={styles.inactiveTabIcon}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    >
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          href: {
            pathname: '/(tabs)/menu',
            params: { tableId },
          },
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'help',
          href: {
            pathname: '/(tabs)/help',
            params: { tableId },
          },
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="orderStatus"
        options={{
          title: 'สถานะออเดอร์',
          href: {
            pathname: '/(tabs)/orderStatus',
            params: { tableId },
          },
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="bill"
        options={{
          title: 'ิBill',
          href: {
            pathname: '/(tabs)/bill',
            params: { tableId },
          },
          tabBarShowLabel: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: '#2A2E33',
    height: 95,
    paddingBottom: 17,
    paddingTop: 10,
    paddingHorizontal: 30,
    bottom: 3,
    // marginBottom: -40,

  },
  customTabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabContainer: {
    backgroundColor: '#FF8A00',
    borderRadius: 21,
    paddingVertical: 10,
    paddingHorizontal: 21,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inactiveTabContainer: {
    alignItems: 'center',
  },
  tabIconImage: {
    width: 25,
    height: 25,
    marginBottom: 3,
  },
  inactiveTabIcon: {
    tintColor: '#FFFFFF',
    width: 25,
    height: 25,
  },
  activeTabIcon: {
    tintColor: '#000000',
    width: 25,
    height: 25,
  },
  activeTabText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
  },
  TabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A2E33',
  },
});