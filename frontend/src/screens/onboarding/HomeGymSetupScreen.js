import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import locationService from '../../services/locationService';
import { useOnboardingContext } from '../../context/OnboardingContext';
import theme from '../../constants/theme';

const DEBOUNCE_MS = 400;

export default function HomeGymSetupScreen({ navigation }) {
  const { updateOnboardingData } = useOnboardingContext();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [error, setError] = useState('');

  const debounceTimer = useRef(null);

  const handleQueryChange = useCallback((text) => {
    setQuery(text);
    setSelectedGym(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length < 3) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      const found = await locationService.searchAddress(text);
      setResults(found);
      setIsSearching(false);
    }, DEBOUNCE_MS);
  }, []);

  const handleSelect = (result) => {
    setSelectedGym(result);
    setResults([]);
    setQuery(result.displayName);
  };

  const handleContinue = () => {
    setError('');

    if (!selectedGym) {
      setError('Please search and select your home gym');
      return;
    }

    updateOnboardingData({
      homeGym: {
        name: selectedGym.displayName.split(',')[0], // short name for the first segment
        address: selectedGym.displayName,
        lat: selectedGym.lat,
        lng: selectedGym.lng,
      },
    });

    navigation.navigate('ProfileVisibility');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set your home gym</Text>
      <Text style={styles.subtitle}>
        This powers automatic check-ins when you're nearby
      </Text>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search for your gym or its address"
          placeholderTextColor={theme.colors.muted}
          value={query}
          onChangeText={handleQueryChange}
        />
        {isSearching && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.searchSpinner}
          />
        )}
      </View>

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.resultText} numberOfLines={2}>
                {item.displayName}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {selectedGym && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedLabel}>Selected gym</Text>
          <Text style={styles.selectedText}>{selectedGym.displayName}</Text>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: theme.spacing.lg,
  },
  searchBox: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingRight: theme.spacing.xl,
  },
  searchSpinner: {
    position: 'absolute',
    right: theme.spacing.md,
  },
  resultsList: {
    marginTop: theme.spacing.sm,
    maxHeight: 240,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultItem: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  selectedCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: theme.spacing.md,
  },
  selectedLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});