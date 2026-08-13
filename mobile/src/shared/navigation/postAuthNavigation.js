import { loadMyHousehold } from '../api/household';
import { useAuthStore } from '../store/authStore';
import {
  saveSignupProgress,
  stepToRoute,
} from '../store/signupProgress';
import { storePendingAuthResponse } from '../api/auth';

/**
 * Shared post-auth routing for Google (and reusable after login).
 * Returning complete users → completeSetup (Main).
 * Incomplete → pending + wizard step 1 (or saved step).
 */
export async function resolvePostAuthNavigation(
  resp,
  authMethod,
  navigation,
  existingProgress,
) {
  storePendingAuthResponse(resp);

  await loadMyHousehold();
  const householdId = useAuthStore.getState().householdId;

  // Returning user with household = setup done
  if (householdId) {
    await saveSignupProgress({
      authMethod,
      step: 'done',
      draft: {},
      email: resp.user.email,
      setupComplete: true,
    });
    useAuthStore.getState().completeSetup();
    return 'home';
  }

  // Has progress mid-wizard — resume
  if (existingProgress && !existingProgress.setupComplete && existingProgress.step !== 'done') {
    useAuthStore.getState().setSignupProgress(existingProgress);
    const route = stepToRoute(
      existingProgress.step,
      existingProgress.authMethod,
    );
    navigation.replace(route);
    return 'wizard';
  }

  // New / incomplete — start wizard (prefill name)
  const progress = {
    authMethod,
    step: 'name',
    email: resp.user.email,
    draft: {
      displayName: resp.user.displayName,
      avatarUrl: resp.user.avatarUrl || undefined,
    },
    setupComplete: false,
  };
  await saveSignupProgress(progress);
  useAuthStore.getState().setSignupProgress(progress);
  navigation.replace('SignupStepName');
  return 'wizard';
}

export async function startEmailSignupProgress(email) {
  const progress = {
    authMethod: 'email',
    step: 'name',
    email,
    draft: {},
    setupComplete: false,
  };
  await saveSignupProgress(progress);
  useAuthStore.getState().setSignupProgress(progress);
  return progress;
}

export async function startPhoneSignupProgress() {
  const progress = {
    authMethod: 'phone',
    step: 'name',
    draft: { countryCode: '+1' },
    setupComplete: false,
  };
  await saveSignupProgress(progress);
  useAuthStore.getState().setSignupProgress(progress);
  return progress;
}
