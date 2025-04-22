import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@env';
console.log(API_BASE_URL); // http://192.168.1.4:3000
export default function IndexScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  let setTableId;
  try {
    // eslint-disable-next-line
    ({ setTableId } = require('../contexts/TableContext').useTable());
    console.log('useTable loaded successfully in IndexScreen');
  } catch (error) {
    console.error('Failed to load useTable in IndexScreen:', error.message);
  }

  console.log('IndexScreen loaded');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async (result) => {
    if (!scanned) {
      setScanned(true);

      const scannedTableNo = result.data.trim(); // เช่น "01", "02", ..., "12"

      try {
        const response = await fetch(`${API_BASE_URL}/api/tables/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_no: scannedTableNo }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unknown error');
        }

        // อัปเดต tableId ใน Context ถ้า setTableId มี
        if (setTableId) {
          setTableId(scannedTableNo);
          console.log('Scanned tableId set in Context:', scannedTableNo);
        } else {
          console.warn('setTableId not available in IndexScreen, skipping Context update');
        }

        Alert.alert('Welcome to MoomAroi!', 'Enjoy your meal 🍽️', [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/(tabs)/menu',
                params: { tableId: scannedTableNo },
              });
            },
          },
        ]);
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to scan table', [
          { text: 'Try Again', onPress: () => setScanned(false) },
        ]);
      }
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ไม่ได้รับสิทธิ์ใช้งานกล้อง</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>สแกน QR Code เพื่อเข้าสู่แอป</Text>
        <View style={styles.scanFrame} />
        {scanned && (
          <TouchableOpacity
            onPress={() => setScanned(false)}
            style={styles.scanAgain}
          >
            <Text style={styles.scanAgainText}>แตะเพื่อสแกนอีกครั้ง</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 40,
    textAlign: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scanAgain: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 40,
  },
  scanAgainText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
});


// import React, { useEffect } from 'react';
// import { useRouter } from 'expo-router';
// import { View, Text, StyleSheet } from 'react-native';

// export default function IndexScreen() {
//   const router = useRouter();

//   useEffect(() => {
//     // เพิ่มการหน่วงเวลา 100ms เพื่อให้แน่ใจว่า Root Layout พร้อม
//     const timer = setTimeout(() => {
//       const defaultTableId = '01';
//       router.replace({
//         pathname: '/(tabs)/menu',
//         params: { tableId: defaultTableId },
//       });
//     }, 100);

//     // ล้าง timer เมื่อ component unmount
//     return () => clearTimeout(timer);
//   }, [router]);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.loadingText}>กำลังโหลด...</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },
//   loadingText: {
//     fontSize: 18,
//     color: '#fff',
//   },
// });