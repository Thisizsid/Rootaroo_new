import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'rootaru_access_token',
  REFRESH_TOKEN: 'rootaru_refresh_token',
  USER: 'rootaru_user',
  HOUSEHOLD_ID: 'rootaru_household_id',
};

export async function saveTokens(accessToken, refreshToken, user) {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
}

export async function saveHouseholdId(householdId) {
  await SecureStore.setItemAsync(KEYS.HOUSEHOLD_ID, householdId);
}

export async function loadTokens() {
  const [accessToken, refreshToken, userJson, householdId] = await Promise.all([
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.getItemAsync(KEYS.USER),
    SecureStore.getItemAsync(KEYS.HOUSEHOLD_ID),
  ]);
  let user = null;
  if (userJson) {
    try { user = JSON.parse(userJson); } catch { /* ignore */ }
  }
  return { accessToken, refreshToken, user, householdId };
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.USER),
    SecureStore.deleteItemAsync(KEYS.HOUSEHOLD_ID),
  ]);
}
