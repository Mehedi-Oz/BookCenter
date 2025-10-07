import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
}

export default function CreateOrderScreen() {
  const { colors } = useTheme();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    address: ''
  });

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    if (!customerDetails.name.trim()) {
      Alert.alert('Required Field', 'Customer name is required to continue.');
      return;
    }

    // Navigate to order building page with customer details
    router.push({
      pathname: '/order/build' as any,
      params: {
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerAddress: customerDetails.address
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Order</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Customer Details Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Enter customer information to create an order
          </Text>

          {/* Customer Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Customer Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter customer name"
              placeholderTextColor={colors.textSecondary}
              value={customerDetails.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Customer Phone */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Phone Number <Text style={[styles.optional, { color: colors.textSecondary }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textSecondary}
              value={customerDetails.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Customer Address */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Address/Details <Text style={[styles.optional, { color: colors.textSecondary }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textAreaInput, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter address or additional details"
              placeholderTextColor={colors.textSecondary}
              value={customerDetails.address}
              onChangeText={(value) => handleInputChange('address', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Order Items</Text>
          <Feather name="arrow-right" size={20} color={Colors.surface} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  optional: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  continueButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
