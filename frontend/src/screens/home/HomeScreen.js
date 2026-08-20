// import { useState, useCallback } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
// import { useFocusEffect } from '@react-navigation/native';
// import { useAuthContext } from '../../context/AuthContext';
// import checkInService from '../../services/checkInService';
// import workoutService from '../../services/workoutService';
// import theme from '../../constants/theme';

// const QUICK_ACTIONS = [
//   { key: 'GymCheckIn', label: 'Check In', emoji: '📍', color: '#00D9A3' },
//   { key: 'ProgressDashboard', label: 'Progress', emoji: '📈', color: '#FF5A3C' },
//   { key: 'StartDateSquad', label: 'Squad', emoji: '🏆', color: '#FFB020' },
//   { key: 'DailyMealPlan', label: 'Diet Plan', emoji: '🍽️', color: '#4D9DFF' },
//   { key: 'SocialFeed', label: 'Feed', emoji: '👥', color: '#C77DFF' },
//   { key: 'ChatList', label: 'Chat', emoji: '💬', color: '#00D9A3' },
//   { key: 'WeeklyInsight', label: 'Insights', emoji: '🧠', color: '#FF5A3C' },
//   { key: 'CoachMarketplace', label: 'Coaches', emoji: '🎓', color: '#4D9DFF' },
// ];

// export default function HomeScreen({ navigation }) {
//   const { user } = useAuthContext();

//   const [checkedInToday, setCheckedInToday] = useState(null);
//   const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);

//   useFocusEffect(
//     useCallback(() => {
//       loadSummary();
//     }, [])
//   );

//   const loadSummary = async () => {
//     setIsLoading(true);
//     try {
//       const todayStr = new Date().toISOString().slice(0, 10);

//       const [checkInData, workoutData] = await Promise.all([
//         checkInService.getMyCheckIns(),
//         workoutService.getMyWorkouts(),
//       ]);

//       const todayCheckIn = checkInData.checkIns.find((c) => c.date === todayStr);
//       setCheckedInToday(todayCheckIn || null);

//       const oneWeekAgo = new Date();
//       oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
//       const recentCount = workoutData.workouts.filter(
//         (w) => new Date(w.date) >= oneWeekAgo
//       ).length;
//       setWeeklyWorkouts(recentCount);
//     } catch (err) {
//       console.error(`[HomeScreen] Summary load error: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <Text style={styles.greeting}>
//         Hey{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
//       </Text>
//       <Text style={styles.subtitle}>Here's where you stand today</Text>

//       {isLoading ? (
//         <View style={styles.loadingBox}>
//           <ActivityIndicator color={theme.colors.primary} />
//         </View>
//       ) : (
//         <View style={styles.statsRow}>
//           <View style={styles.statCard}>
//             <Text style={styles.statEmoji}>{checkedInToday ? '✅' : '⏱️'}</Text>
//             <Text style={styles.statValue}>
//               {checkedInToday ? (checkedInToday.autoVerified ? 'Verified' : 'Checked In') : 'Not yet'}
//             </Text>
//             <Text style={styles.statLabel}>Today's check-in</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statEmoji}>🔥</Text>
//             <Text style={styles.statValue}>{weeklyWorkouts}</Text>
//             <Text style={styles.statLabel}>Workouts this week</Text>
//           </View>
//         </View>
//       )}

//       <Text style={styles.sectionTitle}>Quick Actions</Text>
//       <View style={styles.grid}>
//         {QUICK_ACTIONS.map((action) => (
//           <TouchableOpacity
//             key={action.key}
//             style={styles.actionCard}
//             onPress={() => navigation.navigate(action.key)}
//             activeOpacity={0.85}
//           >
//             <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
//               <Text style={styles.actionEmoji}>{action.emoji}</Text>
//             </View>
//             <Text style={styles.actionLabel}>{action.label}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: theme.colors.background },
//   content: {
//     paddingHorizontal: theme.spacing.lg,
//     paddingTop: theme.spacing.xxl,
//     paddingBottom: theme.spacing.xl,
//   },
//   greeting: {
//     fontSize: theme.fontSize.xxl,
//     fontWeight: theme.fontWeight.heavy,
//     color: theme.colors.text,
//   },
//   subtitle: {
//     fontSize: theme.fontSize.sm,
//     color: theme.colors.muted,
//     marginBottom: theme.spacing.xl,
//   },
//   loadingBox: {
//     height: 100,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xl,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     gap: theme.spacing.md,
//     marginBottom: theme.spacing.xl,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.radius.lg,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     padding: theme.spacing.lg,
//     alignItems: 'center',
//     ...theme.shadow.card,
//   },
//   statEmoji: { fontSize: 28, marginBottom: theme.spacing.xs },
//   statValue: {
//     fontSize: theme.fontSize.md,
//     fontWeight: theme.fontWeight.bold,
//     color: theme.colors.text,
//   },
//   statLabel: {
//     fontSize: theme.fontSize.xs,
//     color: theme.colors.muted,
//     marginTop: 2,
//     textAlign: 'center',
//   },
//   sectionTitle: {
//     fontSize: theme.fontSize.md,
//     fontWeight: theme.fontWeight.semibold,
//     color: theme.colors.text,
//     marginBottom: theme.spacing.md,
//   },
//   grid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: theme.spacing.md,
//   },
//   actionCard: {
//     width: '30%',
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.radius.lg,
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     paddingVertical: theme.spacing.md,
//     alignItems: 'center',
//   },
//   actionIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: theme.radius.full,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: theme.spacing.xs,
//   },
//   actionEmoji: { fontSize: 22 },
//   actionLabel: {
//     fontSize: theme.fontSize.xs,
//     color: theme.colors.text,
//     fontWeight: theme.fontWeight.medium,
//     textAlign: 'center',
//   },
// });

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import checkInService from '../../services/checkInService';
import workoutService from '../../services/workoutService';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const styles = createStyles(theme);

  const [checkedInToday, setCheckedInToday] = useState(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [])
  );

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [checkInData, workoutData] = await Promise.all([
        checkInService.getMyCheckIns(),
        workoutService.getMyWorkouts(),
      ]);

      const todayCheckIn = checkInData.checkIns.find((c) => c.date === todayStr);
      setCheckedInToday(todayCheckIn || null);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCount = workoutData.workouts.filter((w) => new Date(w.date) >= oneWeekAgo).length;
      setWeeklyWorkouts(recentCount);
    } catch (err) {
      console.error(`[HomeScreen] Summary load error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const consistencyPct = Math.min(100, weeklyWorkouts * 20); // simple visual proxy until real % is wired

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>FITCIRCLE</Text>
        <TouchableOpacity style={styles.notifButton}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Check-in status card */}
      <TouchableOpacity
        style={styles.checkInCard}
        onPress={() => navigation.navigate('GymCheckIn')}
        activeOpacity={0.85}
      >
        <View style={[styles.checkInIconCircle, checkedInToday && theme.glow.primary]}>
          <Text style={styles.checkInIcon}>📍</Text>
        </View>
        <View style={styles.checkInTextBlock}>
          <View style={styles.activeSessionTag}>
            <Text style={styles.activeSessionTagText}>
              {checkedInToday ? 'CHECKED IN' : 'NOT CHECKED IN'}
            </Text>
          </View>
          <Text style={styles.checkInTitle}>
            {user?.homeGym?.name?.toUpperCase() || 'SET YOUR HOME GYM'}
          </Text>
          <Text style={styles.checkInSubtext}>
            {checkedInToday
              ? checkedInToday.autoVerified
                ? 'Location Verified ✓'
                : 'Manually checked in'
              : 'Tap to check in today'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Progress bento grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionIcon}>📊</Text>
        <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.xl }} />
      ) : (
        <View style={styles.bentoRow}>
          <View style={styles.bentoCard}>
            <View style={styles.ringOuter}>
              <View style={[styles.ringInner, theme.glow.primary]}>
                <Text style={styles.ringValue}>{consistencyPct}%</Text>
              </View>
            </View>
            <Text style={styles.bentoLabel}>CONSISTENCY</Text>
          </View>

          <View style={styles.bentoCard}>
            <Text style={styles.bentoLabel}>WORKOUTS</Text>
            <Text style={styles.bentoBigNumber}>{weeklyWorkouts}</Text>
            <Text style={styles.bentoSubtext}>this week</Text>
          </View>
        </View>
      )}

      {/* Squad Elite teaser — gold */}
      <TouchableOpacity
        style={[styles.squadCard, theme.glow.tertiary]}
        onPress={() => navigation.navigate('StartDateSquad')}
        activeOpacity={0.9}
      >
        <View style={styles.squadHeaderRow}>
          <Text style={styles.squadIcon}>⭐</Text>
          <Text style={styles.squadTitle}>SQUAD ELITE</Text>
        </View>
        <Text style={styles.squadSubtext}>
          See how your Start Date Squad is doing this week.
        </Text>
        <View style={styles.squadButton}>
          <Text style={styles.squadButtonText}>VIEW SQUAD →</Text>
        </View>
      </TouchableOpacity>

      {/* Quick actions grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      </View>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.key)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionEmoji}>{action.emoji}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const QUICK_ACTIONS = [
  { key: 'ProgressDashboard', label: 'Progress', emoji: '📈' },
  { key: 'DailyMealPlan', label: 'Diet Plan', emoji: '🍽️' },
  { key: 'SocialFeed', label: 'Feed', emoji: '👥' },
  { key: 'ChatList', label: 'Chat', emoji: '💬' },
  { key: 'WeeklyInsight', label: 'Insights', emoji: '🧠' },
  { key: 'CoachMarketplace', label: 'Coaches', emoji: '🎓' },
];

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      paddingHorizontal: theme.spacing.containerMargin,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    logo: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.headline,
      color: theme.colors.primary,
      letterSpacing: 1,
    },
    notifButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifIcon: { fontSize: 18 },

    checkInCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.primary + '4D', // ~30% opacity
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    checkInIconCircle: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary + '33',
      borderWidth: 1,
      borderColor: theme.colors.primary + '80',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.lg,
    },
    checkInIcon: { fontSize: 22 },
    checkInTextBlock: { flex: 1 },
    activeSessionTag: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primary + '1A',
      borderRadius: theme.radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: 4,
    },
    activeSessionTagText: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.primary,
      letterSpacing: 1,
    },
    checkInTitle: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
    },
    checkInSubtext: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      marginTop: 2,
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.md,
    },
    sectionIcon: { fontSize: 16 },
    sectionTitle: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.title,
      color: theme.colors.text,
      textTransform: 'uppercase',
    },

    bentoRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xxl,
    },
    bentoCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 140,
    },
    ringOuter: {
      width: 80,
      height: 80,
      borderRadius: theme.radius.full,
      borderWidth: 6,
      borderColor: theme.colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    ringInner: {
      width: 68,
      height: 68,
      borderRadius: theme.radius.full,
      borderWidth: 4,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringValue: {
      fontFamily: theme.fontFamily.bodyBold,
      fontSize: theme.fontSize.md,
      color: theme.colors.primary,
    },
    bentoLabel: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.textVariant,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    bentoBigNumber: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.display * 0.6,
      color: theme.colors.text,
      marginVertical: 4,
    },
    bentoSubtext: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.xs,
      color: theme.colors.textVariant,
    },

    squadCard: {
      backgroundColor: theme.colors.surfaceLow,
      borderWidth: 1.5,
      borderColor: theme.colors.tertiary + '4D',
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    squadHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    squadIcon: { fontSize: 16 },
    squadTitle: {
      fontFamily: theme.fontFamily.display,
      fontSize: theme.fontSize.title,
      color: theme.colors.tertiary,
      textTransform: 'uppercase',
    },
    squadSubtext: {
      fontFamily: theme.fontFamily.body,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textVariant,
      marginBottom: theme.spacing.md,
    },
    squadButton: {
      backgroundColor: theme.colors.tertiaryContainer,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    squadButtonText: {
      fontFamily: theme.fontFamily.label,
      fontSize: theme.fontSize.xs,
      color: theme.colors.onTertiary,
      letterSpacing: 1,
    },

    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    actionCard: {
      width: '30%',
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    actionEmoji: { fontSize: 22, marginBottom: 4 },
    actionLabel: {
      fontFamily: theme.fontFamily.label,
      fontSize: 10,
      color: theme.colors.text,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
  });