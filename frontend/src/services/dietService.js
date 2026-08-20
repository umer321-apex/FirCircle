import api from './api';

export async function generateDietPlan({ weightKg, heightCm, age, country, healthConditions }) {
  const res = await api.post('/diet/generate', { weightKg, heightCm, age, country, healthConditions });
  return res.data;
}

export async function fetchTodayPlan() {
  const res = await api.get('/diet/today');
  return res.data;
}

export async function addCustomMeal({ slot, foodItemId, servings, customEntry }) {
  const res = await api.post('/diet/custom-meal', { slot, foodItemId, servings, customEntry });
  return res.data;
}