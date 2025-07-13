import { Stack } from 'expo-router';
import { TableProvider } from '../contexts/TableContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
  console.log('TableProvider loaded in _layout.tsx');
  return (
    <SafeAreaProvider>
      <TableProvider>
        <Stack
          screenOptions={{
            headerShown: false, // ปิด header ทุกหน้าตั้งแต่ต้น
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="tabs" options={{ headerShown: false, title: '' }} />
          <Stack.Screen name="MenuDetails1" options={{ headerShown: false, title: '' }} />
          <Stack.Screen name="SuccessfullyAdded" options={{ headerShown: false, title: '' }} />
          <Stack.Screen name="cart" options={{ headerShown: false, title: '' }} />
        </Stack>
      </TableProvider>
    </SafeAreaProvider>
  );
}



// import { Stack } from 'expo-router';

// export default function Layout() {
//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false, // ซ่อน header สำหรับทุกหน้าใน Stack
//       }}
//     />
//   );
// }