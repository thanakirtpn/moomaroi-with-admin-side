import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // เปลี่ยนเป็น IP ถ้าใช้บนมือถือ

export default function TableScreen() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableOrders, setTableOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tables`);
      console.log('Tables response:', JSON.stringify(response.data, null, 2));
      setTables(response.data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to fetch tables');
    }
  };

  const fetchTableOrders = async (tableNo) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tables/${tableNo}/orders`);
      console.log(`Orders for table ${tableNo}:`, JSON.stringify(response.data, null, 2));
      setTableOrders(response.data);
    } catch (err) {
      console.error(`Error fetching orders for table ${tableNo}:`, err);
      setTableOrders(null);
      setError(`Failed to fetch orders for table ${tableNo}`);
    }
  };

  const handleTablePress = (table) => {
    setSelectedTable(table);
    fetchTableOrders(table.table_no);
  };

  const handleComplete = async () => {
    if (!selectedTable) return;
    try {
      await axios.post(`${API_BASE_URL}/api/tables/${selectedTable.table_no}/complete`);
      fetchTables();
      setSelectedTable(null);
      setTableOrders(null);
      console.log(`Table ${selectedTable.table_no} marked as complete`);
    } catch (err) {
      console.error('Error marking table as complete:', err);
      setError('Failed to complete table');
    }
  };

  const renderTableItem = ({ item }) => {
    const isOccupied = item.status === 'Occupied';
    return (
      <TouchableOpacity
        style={[styles.tableItem, isOccupied && styles.occupiedTable]}
        onPress={() => handleTablePress(item)}
      >
        <View style={styles.tableHeader}>
          <Image
            source={isOccupied ? require('../../assets/images/icon.png') : require('../../assets/images/favicon.png')}
            style={styles.tableIcon}
          />
          <Text style={styles.tableNumber}>{item.table_no}</Text>
        </View>
        <Text style={[styles.tableStatus, isOccupied ? styles.occupiedText : styles.availableText]}>
          {isOccupied ? 'Occupied' : 'Available'}
        </Text>
        <Text style={styles.tableTotal}>Total: ฿{item.total_price.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  const renderTableDetails = () => {
    if (!selectedTable || !tableOrders) {
      return <Text style={styles.noDetails}>No Table Details</Text>;
    }

    const { orders, summary } = tableOrders;
    const isOccupied = selectedTable.status === 'Occupied';

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Table Detail #{selectedTable.table_no}</Text>
          <Text style={styles.detailsDate}>Date: 19 Apr 2025 12:34 PM</Text>
        </View>
        <View style={styles.orderList}>
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <View key={order.id} style={styles.orderContainer}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                {order.items.map((item, idx) => {
                  const imageUrl = item.menu_image
                    ? `${API_BASE_URL}${item.menu_image.replace('/Uploads/', '/uploads/')}`
                    : 'https://via.placeholder.com/50';
                  return (
                    <View key={idx} style={styles.itemRow}>
                      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                      <Text style={styles.itemName}>
                        {item.menu_name} {item.meat ? `(${item.meat})` : ''} {item.add_on ? `+ ${item.add_on}` : ''}
                      </Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                      <Text style={styles.itemPrice}>฿{item.price.toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.noDetails}>No orders for this table</Text>
          )}
        </View>
        {isOccupied && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>฿{summary.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT (7%)</Text>
              <Text style={styles.summaryValue}>฿{summary.vat.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>฿{summary.total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeButtonText}>Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Table</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.content}>
        <FlatList
          data={tables}
          renderItem={renderTableItem}
          keyExtractor={(item) => item.table_no}
          style={styles.tableList}
          numColumns={3}
        />
        <View style={styles.detailsWrapper}>{renderTableDetails()}</View>
      </View>
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
  content: {
    flexDirection: 'row',
    height: '90%',
  },
  tableList: {
    flex: 1,
    paddingRight: 10,
  },
  tableItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    elevation: 2,
  },
  occupiedTable: {
    backgroundColor: '#ffe0b2',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  tableIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableStatus: {
    fontSize: 14,
    marginBottom: 5,
  },
  availableText: {
    color: '#4caf50',
  },
  occupiedText: {
    color: '#ff9800',
  },
  tableTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsWrapper: {
    flex: 1,
    paddingLeft: 10,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    height: '100%',
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsDate: {
    fontSize: 14,
    color: '#666',
  },
  orderList: {
    flex: 1,
  },
  orderContainer: {
    marginBottom: 15,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  noDetails: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  summaryContainer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});