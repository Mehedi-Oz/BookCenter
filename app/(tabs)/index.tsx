import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useBookStore } from '@/hooks/useBookStore';
import { SearchBar, SimpleCameraModal, SimpleVoiceModal } from '@/components';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { stats, loading, addBook, refreshData } = useBookStore();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showOCRCamera, setShowOCRCamera] = React.useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/inventory',
        params: { search: searchQuery.trim() }
      });
    }
  };

  const handleOCRTextDetected = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      router.push({
        pathname: '/(tabs)/inventory',
        params: { search: text.trim() }
      });
    }
  };

  const handleVoiceTextDetected = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      router.push({
        pathname: '/(tabs)/inventory',
        params: { search: text.trim() }
      });
    }
  };

  const quickActions = [
    {
      title: 'View Books',
      icon: 'book',
      color: Colors.secondary,
      subtitle: 'Browse your inventory',
      onPress: () => router.push('/(tabs)/inventory'),
    },
    {
      title: 'Add Book',
      icon: 'book-open',
      color: Colors.accent,
      subtitle: 'Add new books to inventory',
      onPress: () => router.push('/book/add'),
    },
    {
      title: 'Create Order',
      icon: 'clipboard',
      color: Colors.primary,
      subtitle: 'Track sales and purchases',
      onPress: () => router.push('/(tabs)/orders'),
    },
    {
      title: 'Add Note',
      icon: 'file-text',
      color: Colors.info,
      subtitle: 'Keep important information',
      onPress: () => router.push('/(tabs)/notes'),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={async () => {
            try {
              setIsRefreshing(true);
              await refreshData();
            } finally {
              setIsRefreshing(false);
            }
          }}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.welcomeText, { fontSize: 30, fontWeight: 'bold', color: '#4A5D3F' }]}>Book Center</Text>
        <Text style={[styles.welcomeText, { fontSize: 16, opacity: 0.8, color: colors.textSecondary }]}>
          Your Digital Library Manager
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, author, or ISBN"
          onCameraPress={() => setShowOCRCamera(true)}
          onVoicePress={() => setShowVoiceSearch(true)}
        />
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.sectionTitle, { color: '#4A5D3F' }]}>Database Statistics</Text>
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={["#B8CCA0", "#A8BC94"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statItem, { borderRadius: 12 }]}
          >
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{stats.totalBooks}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>Books</Text>
          </LinearGradient>
          <LinearGradient
            colors={["#B8CCA0", "#A8BC94"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statItem, { borderRadius: 12 }]}
          >
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{stats.totalOrders}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>Orders</Text>
          </LinearGradient>
          <LinearGradient
            colors={["#B8CCA0", "#A8BC94"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statItem, { borderRadius: 12 }]}
          >
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{stats.totalNotes}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>Notes</Text>
          </LinearGradient>
          <LinearGradient
            colors={["#B8CCA0", "#A8BC94"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statItem, { borderRadius: 12 }]}
          >
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{stats.pendingReminders}</Text>
            <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>Reminders</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: '#4A5D3F' }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Pressable
              key={index}
              style={({ hovered }) => ([
                styles.actionCard,
                { backgroundColor: hovered ? '#B8CCA0' : colors.surface }
              ])}
              onPress={action.onPress}
            >
              {({ hovered }) => (
                <>
                  <View style={[styles.actionIcon, { backgroundColor: '#4A5D3F26' }]}>
                    <Feather name={action.icon as keyof typeof Feather.glyphMap} size={20} color={hovered ? '#FFFFFF' : action.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: hovered ? '#FFFFFF' : '#4A5D3F' }]}>{action.title}</Text>
                    <Text style={[styles.actionSubtitle, { color: hovered ? '#FFFFFF' : colors.textSecondary }]}>{action.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={hovered ? '#FFFFFF' : colors.textSecondary} />
                </>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <SimpleCameraModal
        visible={showOCRCamera}
        onClose={() => setShowOCRCamera(false)}
        onTextDetected={handleOCRTextDetected}
      />

      <SimpleVoiceModal
        visible={showVoiceSearch}
        onClose={() => setShowVoiceSearch(false)}
        onTextDetected={handleVoiceTextDetected}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  searchContainer: {
    margin: 16,
    alignSelf: 'stretch',
  },
  searchButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'column',
  },
  actionCard: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A5D3F',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'left',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'left',
  },
});
