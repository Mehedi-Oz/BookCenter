import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useBookStore } from '@/hooks/useBookStore';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components';
import { Note, Reminder } from '@/types';

export default function NotesScreen() {
  const { notes, reminders, addNote, updateNote, deleteNote, addReminder, updateReminder, deleteReminder, refreshData } = useBookStore();
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [expandedItem, setExpandedItem] = useState<{ type: 'note' | 'reminder'; id: string } | null>(null);

  const toggleExpand = (type: 'note' | 'reminder', id: string) => {
    setExpandedItem(prev => (prev && prev.type === type && prev.id === id ? null : { type, id }));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content.');
      return;
    }

    try {
      if (editingNote) {
        // Update existing note
        await updateNote(editingNote.id, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
        });
        setEditingNote(null);
      } else {
        // Add new note
        await addNote({
          title: noteTitle.trim(),
          content: noteContent.trim(),
        });
      }

      setNoteTitle('');
      setNoteContent('');
      setShowAddNote(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setShowAddNote(true);
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setShowAddNote(false);
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert('Error', 'Please enter a reminder title.');
      return;
    }

    try {
      if (editingReminder) {
        // Update existing reminder
        await updateReminder(editingReminder.id, {
          title: reminderTitle.trim(),
          description: reminderDescription.trim() || undefined,
          dueDate: reminderDate.getTime(),
        });
        setEditingReminder(null);
      } else {
        // Add new reminder
        await addReminder({
          title: reminderTitle.trim(),
          description: reminderDescription.trim() || undefined,
          dueDate: reminderDate.getTime(),
          completed: false,
        });
      }

      setReminderTitle('');
      setReminderDescription('');
      setReminderDate(new Date());
      setShowAddReminder(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setReminderTitle(reminder.title);
    setReminderDescription(reminder.description || '');
    setReminderDate(new Date(reminder.dueDate));
    setShowAddReminder(true);
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminder.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder. Please try again.');
            }
          },
        },
      ]
    );
  };

  const cancelReminderEdit = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDescription('');
    setReminderDate(new Date());
    setShowAddReminder(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const currentDate = new Date(reminderDate);
      currentDate.setFullYear(selectedDate.getFullYear());
      currentDate.setMonth(selectedDate.getMonth());
      currentDate.setDate(selectedDate.getDate());
      setReminderDate(currentDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const currentDate = new Date(reminderDate);
      currentDate.setHours(selectedTime.getHours());
      currentDate.setMinutes(selectedTime.getMinutes());
      setReminderDate(currentDate);
    }
  };

  const renderNote = ({ item }: { item: Note }) => (
    <Pressable
      onPress={() => toggleExpand('note', item.id)}
      style={[
        styles.noteCard,
        {
          // Soft sage-tinted background and secondary border for notes
          backgroundColor: `${colors.secondary}15`,
          borderColor: colors.secondary,
          borderLeftColor: colors.primary,
        },
      ]}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteHeaderLeft}>
          <Feather name="file-text" size={20} color={colors.primary} />
          <Text style={[styles.noteTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { (e as any)?.stopPropagation?.(); handleEditNote(item); }}
          >
            <Feather name="edit-2" size={16} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { (e as any)?.stopPropagation?.(); handleDeleteNote(item); }}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text
        style={[styles.noteContent, { color: colors.textSecondary }]}
        numberOfLines={expandedItem?.type === 'note' && expandedItem.id === item.id ? undefined : 3}
      >
        {item.content}
      </Text>
      <Text style={[styles.noteDate, { color: colors.textLight }]}>{formatDate(item.updatedAt)}</Text>
    </Pressable>
  );

  const renderReminder = ({ item }: { item: Reminder }) => {
    const isOverdue = item.dueDate < Date.now() && !item.completed;
    const isDueToday = new Date(item.dueDate).toDateString() === new Date().toDateString();
    const baseTint = isOverdue ? colors.error : isDueToday ? colors.warning : colors.accent;

    return (
      <Pressable
        onPress={() => toggleExpand('reminder', item.id)}
        style={[
          styles.reminderCard,
          {
            // Accent/warning/error tinted background and border for reminders
            backgroundColor: `${baseTint}15`,
            borderColor: baseTint,
            borderLeftColor: baseTint,
          },
        ]}
      >
        <View style={styles.reminderHeader}>
          <View style={styles.reminderHeaderLeft}>
            <Feather
              name="calendar"
              size={20}
              color={isOverdue ? colors.error : isDueToday ? colors.warning : colors.accent}
            />
            <Text style={[
              styles.reminderTitle,
              { color: colors.text },
              isOverdue && { color: colors.error },
            ]}>
              {item.title}
            </Text>
          </View>
          <View style={styles.reminderActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => { (e as any)?.stopPropagation?.(); handleEditReminder(item); }}
            >
              <Feather name="edit-2" size={16} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => { (e as any)?.stopPropagation?.(); handleDeleteReminder(item); }}
            >
              <Feather name="trash-2" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {item.description && (
          <Text
            style={[styles.reminderDescription, { color: colors.textSecondary }]}
            numberOfLines={expandedItem?.type === 'reminder' && expandedItem.id === item.id ? undefined : 2}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.reminderFooter}>
          <Text style={[
            styles.reminderDate,
            { color: colors.textLight },
            isOverdue && { color: colors.error },
            isDueToday && { color: colors.warning },
          ]}>
            {isOverdue ? 'Overdue • ' : isDueToday ? 'Due today • ' : ''}
            {formatDate(item.dueDate)}
          </Text>

          {!item.completed && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: isOverdue ? `${colors.error}15` : isDueToday ? `${colors.warning}15` : `${colors.accent}15` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isOverdue ? colors.error : isDueToday ? colors.warning : colors.accent }
              ]}>
                PENDING
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="file-text"
      title="No notes or reminders"
      subtitle="Keep track of important information and set reminders for your bookstore."
    >
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddNote(true)}
        >
          <Text style={styles.addButtonText}>Add Note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => setShowAddReminder(true)}
        >
          <Text style={styles.addButtonText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>
    </EmptyState>
  );

  const allItems = [
    ...notes.map(note => ({ ...note, type: 'note' as const })),
    ...reminders.map(reminder => ({ ...reminder, type: 'reminder' as const })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(item => {
      if (item.type === 'note') {
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q)
        );
      }
      // reminder
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description ? item.description.toLowerCase().includes(q) : false)
      );
    });
  }, [allItems, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.gradientHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.pageTitle, { fontSize: 26, fontWeight: 'bold', color: '#4A5D3F' }]}>Notes & Reminders</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes and reminders..."
          showActions={false}
        />
      </View>

      <View style={styles.header}>
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}, {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddNote(true)}
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowAddReminder(true)}
          >
            <Feather name="calendar" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={({ item }) =>
          item.type === 'note' ? renderNote({ item }) : renderReminder({ item })
        }
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshing={isRefreshing}
        onRefresh={async () => {
          try {
            setIsRefreshing(true);
            await refreshData();
          } finally {
            setIsRefreshing(false);
          }
        }}
      />

      {/* Add Note Modal */}
      {showAddNote && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingNote ? 'Edit Note' : 'Add Note'}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Note title"
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Note content"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={cancelEdit}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddNote}
              >
                <Text style={styles.saveButtonText}>
                  {editingNote ? 'Update' : 'Save Note'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add/Edit Reminder Modal */}
      {showAddReminder && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Reminder title"
              value={reminderTitle}
              onChangeText={setReminderTitle}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optional)"
              value={reminderDescription}
              onChangeText={setReminderDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={colors.textLight}
            />

            {/* Date and Time Selection */}
            <View style={styles.dateTimeContainer}>
              <Text style={[styles.dateTimeLabel, { color: colors.text }]}>Due Date & Time:</Text>

              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <Text style={[styles.dateTimeButtonText, { color: colors.text }]}>
                    {reminderDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Feather name="clock" size={16} color={colors.primary} />
                  <Text style={[styles.dateTimeButtonText, { color: colors.text }]}>
                    {reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={cancelReminderEdit}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddReminder}
              >
                <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                  {editingReminder ? 'Update' : 'Save Reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    margin: 16,
    alignSelf: 'stretch',
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  reminderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    // colors applied inline
  },
  dueTodayCard: {
    // colors applied inline
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  overdueText: {
    // colors applied inline
  },
  dueTodayText: {
    // colors applied inline
  },
  reminderDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderDate: {
    fontSize: 12,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
  },
  reminderNote: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
  },
  reminderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateTimeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});