import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import scheduleService from '../../services/scheduleService';
import theme from '../../constants/theme';

const MAX_SLOTS = 4;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index 0 = Sunday, matches Date#getDay()
const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = [0, 15, 30, 45];

const emptyForm = () => ({
  label: '',
  hour12: 7,
  minute: 0,
  meridiem: 'AM',
  durationMinutes: 60,
  daysOfWeek: [1, 2, 3, 4, 5], // sensible default: weekdays
});

// Converts a 12-hour form value to the 0-23 value the backend stores.
const to24Hour = (hour12, meridiem) => {
  const h = hour12 % 12;
  return meridiem === 'PM' ? h + 12 : h;
};

// Converts a stored 0-23 hour back to a 12-hour display value.
const to12Hour = (hour24) => {
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, meridiem };
};

const formatTime = (hour, minute) => {
  const { hour12, meridiem } = to12Hour(hour);
  return `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`;
};

const formatDays = (daysOfWeek) => {
  if (daysOfWeek.length === 7) return 'Every day';
  const sorted = [...daysOfWeek].sort((a, b) => a - b);
  if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
  if (JSON.stringify(sorted) === JSON.stringify([0, 6])) return 'Weekends';
  return sorted.map((d) => DAY_LABELS[d]).join(' ');
};

export default function GymScheduleScreen() {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // null = form closed, 'new' = adding, number = editing slots[index]
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await scheduleService.getSchedule();
      setSlots(data.gymSchedule || []);
    } catch (err) {
      console.error(`[GymScheduleScreen] Load error: ${err.message}`);
      setError('Could not load your gym schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const persist = useCallback(async (nextSlots) => {
    setIsSaving(true);
    setError('');
    try {
      const data = await scheduleService.updateSchedule(nextSlots);
      setSlots(data.gymSchedule || nextSlots);
      return true;
    } catch (err) {
      console.error(`[GymScheduleScreen] Save error: ${err.message}`);
      setError(err.response?.data?.message || 'Could not save your gym schedule. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const openAddForm = () => {
    setForm(emptyForm());
    setEditingIndex('new');
  };

  const openEditForm = (index) => {
    const slot = slots[index];
    const { hour12, meridiem } = to12Hour(slot.hour);
    setForm({
      label: slot.label || '',
      hour12,
      minute: slot.minute,
      meridiem,
      durationMinutes: slot.durationMinutes,
      daysOfWeek: [...slot.daysOfWeek],
    });
    setEditingIndex(index);
  };

  const closeForm = () => {
    setEditingIndex(null);
    setForm(emptyForm());
  };

  const toggleDay = (dayIndex) => {
    setForm((prev) => {
      const has = prev.daysOfWeek.includes(dayIndex);
      const daysOfWeek = has
        ? prev.daysOfWeek.filter((d) => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex].sort((a, b) => a - b);
      return { ...prev, daysOfWeek };
    });
  };

  const handleSaveSlot = async () => {
    if (form.daysOfWeek.length === 0) {
      setError('Pick at least one day for this gym time.');
      return;
    }

    const newSlot = {
      label: form.label.trim(),
      hour: to24Hour(form.hour12, form.meridiem),
      minute: form.minute,
      durationMinutes: form.durationMinutes,
      daysOfWeek: form.daysOfWeek,
    };

    const nextSlots =
      editingIndex === 'new'
        ? [...slots, newSlot]
        : slots.map((s, i) => (i === editingIndex ? newSlot : s));

    const ok = await persist(nextSlots);
    if (ok) closeForm();
  };

  const handleDeleteSlot = (index) => {
    Alert.alert('Remove gym time?', 'You won\u2019t get reminders for this time slot anymore.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const nextSlots = slots.filter((_, i) => i !== index);
          await persist(nextSlots);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gym Schedule</Text>
      <Text style={styles.subtitle}>
        Set the times you usually go — we'll remind you {5} minutes before it's time to head out.
      </Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {slots.length === 0 && editingIndex === null && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⏰</Text>
          <Text style={styles.emptyText}>No gym times set yet</Text>
          <Text style={styles.emptySubtext}>Add one below to start getting reminders.</Text>
        </View>
      )}

      {slots.map((slot, index) => (
        <TouchableOpacity
          key={`${slot.hour}-${slot.minute}-${index}`}
          style={styles.slotCard}
          onPress={() => openEditForm(index)}
          activeOpacity={0.85}
        >
          <View style={styles.slotTimeBlock}>
            <Text style={styles.slotTime}>{formatTime(slot.hour, slot.minute)}</Text>
            <Text style={styles.slotDuration}>~{slot.durationMinutes} min</Text>
          </View>
          <View style={styles.slotMetaBlock}>
            <Text style={styles.slotLabel} numberOfLines={1}>
              {slot.label || 'Gym session'}
            </Text>
            <Text style={styles.slotDays}>{formatDays(slot.daysOfWeek)}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSlot(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {editingIndex !== null ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingIndex === 'new' ? 'Add Gym Time' : 'Edit Gym Time'}</Text>

          <Text style={styles.fieldLabel}>Label (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Morning Cardio"
            placeholderTextColor={theme.colors.muted}
            value={form.label}
            onChangeText={(text) => setForm((prev) => ({ ...prev, label: text }))}
            maxLength={30}
          />

          <Text style={styles.fieldLabel}>Time</Text>
          <View style={styles.chipScrollRow}>
            {HOURS_12.map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.chip, form.hour12 === h && styles.chipActive]}
                onPress={() => setForm((prev) => ({ ...prev, hour12: h }))}
              >
                <Text style={[styles.chipText, form.hour12 === h && styles.chipTextActive]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chipScrollRow}>
            {MINUTES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, form.minute === m && styles.chipActive]}
                onPress={() => setForm((prev) => ({ ...prev, minute: m }))}
              >
                <Text style={[styles.chipText, form.minute === m && styles.chipTextActive]}>
                  :{String(m).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
            {['AM', 'PM'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, form.meridiem === m && styles.chipActive]}
                onPress={() => setForm((prev) => ({ ...prev, meridiem: m }))}
              >
                <Text style={[styles.chipText, form.meridiem === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Repeat on</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((label, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[styles.dayCircle, form.daysOfWeek.includes(dayIndex) && styles.dayCircleActive]}
                onPress={() => toggleDay(dayIndex)}
              >
                <Text
                  style={[
                    styles.dayCircleText,
                    form.daysOfWeek.includes(dayIndex) && styles.dayCircleTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Usual duration</Text>
          <View style={styles.chipScrollRow}>
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, form.durationMinutes === d && styles.chipActive]}
                onPress={() => setForm((prev) => ({ ...prev, durationMinutes: d }))}
              >
                <Text style={[styles.chipText, form.durationMinutes === d && styles.chipTextActive]}>
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeForm} disabled={isSaving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSlot} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, slots.length >= MAX_SLOTS && styles.addButtonDisabled]}
          onPress={openAddForm}
          disabled={slots.length >= MAX_SLOTS}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>
            {slots.length >= MAX_SLOTS ? `Max ${MAX_SLOTS} gym times` : '+ Add Gym Time'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.headline,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginTop: 4,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.glow.subtle,
  },
  slotTimeBlock: {
    marginRight: theme.spacing.md,
    minWidth: 78,
  },
  slotTime: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  slotDuration: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  slotMetaBlock: {
    flex: 1,
  },
  slotLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  slotDays: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceHigh,
  },
  deleteButtonText: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.surfaceHigh,
  },
  addButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  formTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  chipScrollRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLow,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  chipTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLow,
  },
  dayCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayCircleText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  dayCircleTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});