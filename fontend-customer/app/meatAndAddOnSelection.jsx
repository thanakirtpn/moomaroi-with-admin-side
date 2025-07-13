import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// import { API_BASE_URL } from '@env';
const API_BASE_URL = 'http://172.20.10.3:3000';
console.log(API_BASE_URL); // http://192.168.1.4:3000
const MeatAndAddOnSelection = ({ onMeatSelect, onAddOnSelect }) => {
  const [selectedMeat, setSelectedMeat] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [meatOptions, setMeatOptions] = useState([]);
  const [addOnOptions, setAddOnOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenuOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/options`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // ตรวจสอบและจัดการกับ meat_options และ addon_options
        const formattedMeatOptions = data.meat_options.map((item, index) => ({
          id: item.id ? parseInt(item.id) : `${index}`, // ถ้าไม่มี id ให้ใช้ index แทน
          label: item.name,
          price: item.extra_price,
        }));

        const formattedAddOnOptions = data.addon_options.map((item, index) => ({
          id: item.id ? parseInt(item.id) : `${index}`, // ถ้าไม่มี id ให้ใช้ index แทน
          label: item.name,
          price: item.extra_price,
        }));

        setMeatOptions(formattedMeatOptions);
        setAddOnOptions(formattedAddOnOptions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu options:', err.message, err.stack);
        setError('ไม่สามารถโหลดตัวเลือกเมนูได้ กรุณาลองใหม่');
        setLoading(false);
      }
    };

    fetchMenuOptions();
  }, []);

  const meatSelection = useMemo(() => {
    const selectedMeatOption = meatOptions.find(item => item.label === selectedMeat);
    const totalPrice = selectedMeatOption ? parseFloat(selectedMeatOption.price || 0) : 0;
    const meatId = selectedMeatOption ? selectedMeatOption.id : null;
    return {
      meat: selectedMeat ? { label: selectedMeat, id: meatId } : null,
      totalPrice,
    };
  }, [selectedMeat, meatOptions]);

  useEffect(() => {
    onMeatSelect(meatSelection.meat, meatSelection.totalPrice);
  }, [meatSelection, onMeatSelect]);

  const addOnSelection = useMemo(() => {
    const totalPrice = selectedAddOns.reduce((sum, addOnLabel) => {
      const addOn = addOnOptions.find(item => item.label === addOnLabel);
      return sum + (parseFloat(addOn?.price) || 0);
    }, 0);

    const selectedAddOnIds = selectedAddOns
      .map(label => addOnOptions.find(item => item.label === label))
      .map(item => item.id); // ดึง id ของ add-on

    return {
      addOns: selectedAddOns,
      totalPrice,
      addOnIds: selectedAddOnIds,
    };
  }, [selectedAddOns, addOnOptions]);

  useEffect(() => {
    onAddOnSelect(addOnSelection.addOns, addOnSelection.totalPrice, addOnSelection.addOnIds);
  }, [addOnSelection, onAddOnSelect]);

  const handleSelectMeat = (meatLabel) => {
    if (selectedMeat === meatLabel) {
      setSelectedMeat(null);
    } else {
      setSelectedMeat(meatLabel);
    }
  };

  const handleSelectAddOn = (addOnLabel) => {
    const isSelected = selectedAddOns.includes(addOnLabel);
    if (isSelected) {
      setSelectedAddOns(selectedAddOns.filter(label => label !== addOnLabel));
    } else {
      setSelectedAddOns([...selectedAddOns, addOnLabel]);
    }
  };

  if (loading) {
    return <Text style={styles.loadingText}>กำลังโหลด...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Select Meat</Text>
        <ScrollView>
          {meatOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.optionContainer, selectedMeat === item.label && styles.selectedOption]}
              onPress={() => handleSelectMeat(item.label)}
            >
              <View style={styles.radioOuter}>
                {selectedMeat === item.label && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>{item.label}</Text>
              <Text style={styles.optionPrice}>+฿{item.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Add-On</Text>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {addOnOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.addOnBox, selectedAddOns.includes(item.label) && styles.selectedAddOnBox]}
              onPress={() => handleSelectAddOn(item.label)}
            >
              <View style={styles.checkboxOuter}>
                {selectedAddOns.includes(item.label) && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.optionLabel}>{item.label}</Text>
              <Text style={styles.optionPrice}>+฿{item.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedOption: {
    backgroundColor: '#F5F5F5',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ABABAB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8A00',
  },
  addOnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ABABAB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  selectedAddOnBox: {
    borderColor: '#FF8A00',
    backgroundColor: '#FFE0B2',
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ABABAB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FF8A00',
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
  optionPrice: {
    fontSize: 16,
    color: '#333',
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default MeatAndAddOnSelection;
