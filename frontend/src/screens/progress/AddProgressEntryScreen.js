import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import progressService from '../../services/progressService';
import theme from '../../constants/theme';
import ShareToFeedModal from '../../components/feed/ShareToFeedModal';

export default function AddProgressEntryScreen({ navigation }) {
  const [weightKg, setWeightKg] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [error, setError] = useState('');
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'success'
  const [savedEntryId, setSavedEntryId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to attach a progress photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setError('');

    const hasWeight = weightKg.trim().length > 0;
    const hasMeasurements = chestCm.trim().length > 0 || waistCm.trim().length > 0;

    if (!hasWeight && !hasMeasurements && !photoUri) {
      setError('Add a weight, measurement, or photo before saving');
      return;
    }

    setUploadState('uploading');
    try {
      const measurements = {};
      if (chestCm.trim()) measurements.chestCm = parseFloat(chestCm);
      if (waistCm.trim()) measurements.waistCm = parseFloat(waistCm);

      const data = await progressService.addProgressEntry({
        weightKg: hasWeight ? parseFloat(weightKg) : undefined,
        measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
        photoUri,
      });

      setUploadState('success');
      setSavedEntryId(data.entry?._id || null);
      // Give the user a moment to see the "Saved!" state, then offer to
      // share instead of immediately navigating away.
      setTimeout(() => {
        if (data.entry?._id) {
          setShowShareModal(true);
        } else {
          navigation.goBack();
        }
      }, 700);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not save entry. Please try again.';
      console.error(`[AddProgressEntryScreen] Save error: ${message}`);
      setError(message);
      setUploadState('idle');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Progress</Text>
      <Text style={styles.subtitle}>Weight, measurements, or a photo — whatever you've got</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 74.5"
          placeholderTextColor={theme.colors.muted}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Chest (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={theme.colors.muted}
              value={chestCm}
              onChangeText={setChestCm}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Waist (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={theme.colors.muted}
              value={waistCm}
              onChangeText={setWaistCm}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text style={styles.label}>Progress Photo</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.85}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <Text style={styles.photoPickerText}>📷 Tap to add a photo</Text>
          )}
        </TouchableOpacity>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, uploadState !== 'idle' && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={uploadState !== 'idle'}
          activeOpacity={0.85}
        >
          {uploadState === 'uploading' && (
            <>
              <ActivityIndicator color={theme.colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Uploading…</Text>
            </>
          )}
          {uploadState === 'success' && <Text style={styles.buttonText}>✓ Saved!</Text>}
          {uploadState === 'idle' && <Text style={styles.buttonText}>Save Entry</Text>}
        </TouchableOpacity>
      </View>

      <ShareToFeedModal
        visible={showShareModal}
        type="progressPhoto"
        contentRefId={savedEntryId}
        onClose={() => {
          setShowShareModal(false);
          navigation.goBack();
        }}
        onShared={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xl,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowItem: { flex: 1 },
  photoPicker: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPickerText: {
    color: theme.colors.muted,
    fontSize: theme.fontSize.sm,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonDisabled: { opacity: 0.8 },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});