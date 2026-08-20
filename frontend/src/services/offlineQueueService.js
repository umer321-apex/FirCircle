import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import workoutService from './workoutService';

const QUEUE_KEY = 'fitcircle_offline_workout_queue';

const getQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(`[offlineQueueService.getQueue] Error: ${error.message}`);
    return [];
  }
};

const saveQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error(`[offlineQueueService.saveQueue] Error: ${error.message}`);
  }
};

// Adds a workout to the local queue instead of sending it immediately
const enqueueWorkout = async (splitCategory, entries) => {
  const queue = await getQueue();
  queue.push({ id: Date.now().toString(), splitCategory, entries, queuedAt: new Date().toISOString() });
  await saveQueue(queue);
};

// Attempts to sync all queued workouts to the backend. Called on app foreground
// and whenever connectivity is restored.
const syncQueue = async () => {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return { synced: 0, failed: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await workoutService.logWorkout(item.splitCategory, item.entries);
      synced += 1;
    } catch (error) {
      console.error(`[offlineQueueService.syncQueue] Failed to sync item ${item.id}: ${error.message}`);
      remaining.push(item); // keep it queued, try again next time
    }
  }

  await saveQueue(remaining);
  return { synced, failed: remaining.length };
};

const getQueueLength = async () => {
  const queue = await getQueue();
  return queue.length;
};

export default { enqueueWorkout, syncQueue, getQueueLength };