import * as SecureStore from 'expo-secure-store';

const KEY = 'rootaru_signup_progress';

const STEP_TO_ROUTE = {
  name: 'SignupStepName',
  birthday: 'SignupStepBirthday',
  phone: 'SignupStepPhone',
  avatar: 'SignupStepAvatar',
  household: 'HouseholdSetup',
  address: 'SignupStepAddress',
  verify: 'EmailVerification',
  invite: 'InviteMembers',
};

export function stepToRoute(step, authMethod) {
  if (step === 'done') return 'InviteMembers';
  if (step === 'verify' && authMethod === 'phone') return 'PhoneVerification';
  if (step === 'verify' && authMethod === 'google') return 'InviteMembers';
  return STEP_TO_ROUTE[step];
}

export async function saveSignupProgress(progress) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(progress));
}

export async function loadSignupProgress() {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSignupProgress() {
  await SecureStore.deleteItemAsync(KEY);
}

export async function updateSignupProgress(patch) {
  const current = (await loadSignupProgress()) || {
    authMethod: 'email',
    step: 'name',
    draft: {},
  };
  const next = {
    ...current,
    ...patch,
    draft: { ...current.draft, ...(patch.draft || {}) },
  };
  await saveSignupProgress(next);
  return next;
}
