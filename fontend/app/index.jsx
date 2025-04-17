import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = (result) => {
    if (!scanned) {
      setScanned(true);
      console.log('Scanned data:', result.data);
      try {
        const data = result.data.startsWith('{') ? JSON.parse(result.data) : { tableId: result.data };
        Alert.alert('สแกนสำเร็จ', `ยินดีต้อนรับสู่โต๊ะ: ${data.tableId}`, [
          {
            text: 'ตกลง',
            onPress: () => {
              router.push({
                pathname: '/(tabs)/menu',
                params: { tableId: data.tableId },
              });
            },
          },
        ]);
      } catch (e) {
        Alert.alert('ข้อผิดพลาด', 'QR Code ไม่ถูกต้อง', [
          { text: 'ตกลง', onPress: () => setScanned(false) },
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