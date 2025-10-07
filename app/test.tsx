import React from 'react';
import { View, Text } from 'react-native';

// Test individual imports
import { StatCard } from '@/components/StatCard';
import { SearchBar } from '@/components/SearchBar';

// Comment out the problematic ones to test
// import { OCRCameraModal } from '@/components/OCRCameraModal';
// import { VoiceSearchModal } from '@/components/VoiceSearchModal';

export default function TestScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Test Screen</Text>
      <StatCard title="Test" value="123" icon="book" />
      <SearchBar
        value=""
        onChangeText={() => { }}
        placeholder="Test search"
      />
    </View>
  );
}
