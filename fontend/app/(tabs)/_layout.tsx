import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

export default function TabsLayout() {
  const { tableId } = useLocalSearchParams();
  
  console.log('Table ID in TabsLayout:', tableId);

  return (
    <Tabs initialRouteName="menu">
      <Tabs.Screen
        name="menu"
        options={{
          title: 'เมนู',
          tabBarIcon: ({ color }) => <FontAwesome name="cutlery" size={24} color={color} />,
          href: {
            pathname: '/(tabs)/menu',
            params: { tableId },
          },
        }}
      />
      <Tabs.Screen
        name="orderStatus"
        options={{
          title: 'สถานะออเดอร์',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
          href: {
            pathname: '/(tabs)/orderStatus',
            params: { tableId },
          },
        }}
      />
    </Tabs>
  );
}