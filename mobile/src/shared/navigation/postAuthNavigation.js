import { loadMyHousehold } from '../api/household';
import { useAuthStore } from '../store/authStore';
import {
  saveSignupProgress,
  loadSignupProgress,
  updateSignupProgress,
  stepToRoute,
} from '../store/signupProgress';
import { storePendingAuthResponse, authApi } from '../api/auth';

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

/**
 * Shared "what's next" routing after a household has been created or
 * joined — phone auth needs OTP verification, unverified email needs
 * email verification, Google/already-verified accounts skip straight to
 * inviting members. Used by both HouseholdSetupScreen (join path) and
 * SignupStepAddressScreen (create path, after saving the home address).
 */
export async function navigateAfterHouseholdSetup(navigation) {
  const progress = await loadSignupProgress();
  const method = progress?.authMethod || 'email';
  const user = useAuthStore.getState().user;
  if (method === 'phone') {
    await updateSignupProgress({
      step: 'verify',
    });
    const phone = progress?.phone || user?.phone || '';
    let code;
    try {
      const sent = await authApi.sendPhoneOtp(phone);
      code = sent.code;
    } catch {
      /* still open verify screen */
    }
    navigation.navigate('PhoneVerification', {
      phone,
      code,
    });
  } else if (method === 'google' || user?.isVerified) {
    await updateSignupProgress({
      step: 'invite',
    });
    navigation.navigate('InviteMembers');
  } else {
    await updateSignupProgress({
      step: 'verify',
    });
    navigation.navigate('EmailVerification', {
      email: user?.email,
    });
  }
}
