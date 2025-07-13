import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useTable } from '../../contexts/TableContext';

const RecommendScreen = () => {
  const { tableId } = useTable();
  console.log('Table ID in RecommendScreen:', tableId);

  const [userInput, setUserInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://172.20.10.3:3000'; // เปลี่ยนเป็น Node.js server

  const fetchRecommendations = async () => {
    if (!userInput.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกคำที่ต้องการ');
      return;
    }

    if (!tableId) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบหมายเลขโต๊ะ กรุณากลับไปหน้าเมนู');
      return;
    }

    setLoading(true);
    setRecommendations([]);
    setMessage('');

    try {
      console.log('กำลังเรียก API ที่:', `${API_BASE_URL}/recommend`);
      console.log('Request body:', JSON.stringify({ user_input: userInput, table_id: tableId }));
      const response = await axios.post(`${API_BASE_URL}/recommend`, {
        user_input: userInput,
        table_id: tableId,
      });

      console.log('API response:', response.data);
      const { recommendations, message } = response.data;
      setRecommendations(recommendations || []);
      setMessage(message || 'ไม่มีข้อความจากเซิร์ฟเวอร์');
    } catch (error) {
      console.error('Error fetching recommendations:', error.message, error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      Alert.alert('ข้อผิดพลาด', `ไม่สามารถดึงคำแนะนำได้: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <Text style={styles.menuName}>{item.name}</Text>
      <Text style={styles.menuDescription}>{item.description}</Text>
      <Text style={styles.menuPrice}>ราคา: {item.price}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>แนะนำเมนู</Text>

      <TextInput
        style={styles.input}
        placeholder="อยากกินอะไร? (เช่น ผัก, เผ็ด)"
        value={userInput}
        onChangeText={setUserInput}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="รับคำแนะนำ"
          onPress={fetchRecommendations}
          color="#FF6347"
          disabled={loading}
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#FF6347" style={styles.loading} />}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <FlatList
        data={recommendations}
        renderItem={renderMenuItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีคำแนะนำ</Text>}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginBottom: 10,
  },
  loading: {
    marginVertical: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  list: {
    marginTop: 10,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  menuPrice: {
    fontSize: 16,
    color: '#FF6347',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RecommendScreen;