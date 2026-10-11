import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));
const mockGoogle = jest.fn();
jest.mock('../../shared/hooks/useGoogleSignIn', () => ({ useGoogleSignIn: () => ({ signIn: mockGoogle, isLoading: false }) }));
const mockSave = jest.fn(async () => {});
jest.mock('../../shared/legal/pendingAgreement', () => ({
  savePendingAgreement: (...a) => mockSave(...a),
  METHODS: { SIGNUP_CHECKBOX: 'signup_checkbox', SIGNIN_NOTICE: 'signin_notice' },
}));
jest.mock('../../shared/hooks/useAppleSignIn', () => ({ useAppleSignIn: () => ({ signIn: jest.fn(), isLoading: false }) }));
jest.mock('../../shared/api/auth', () => ({ authApi: {}, storePendingAuthResponse: jest.fn() }));
jest.mock('../../shared/api/household', () => ({ loadMyHousehold: jest.fn() }));
jest.mock('../../shared/navigation/postAuthNavigation', () => ({ resolvePostAuthNavigation: jest.fn() }));
jest.mock('../../shared/store/signupProgress', () => ({ loadSignupProgress: jest.fn() }));
jest.mock('../../shared/store/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));

const WebBrowser = require('expo-web-browser');
const { TERMS_URL, PRIVACY_URL } = require('../../shared/billing/legalLinks');
const SignInScreen = require('../SignInScreen').default;

describe('SignInScreen legal notice', () => {
  // Google, Apple and phone sign-in also create accounts for new people, who never see the sign-up checkbox.
  it('tells people the Terms and Privacy Policy apply, with working links', () => {
    const { getByText } = render(<SignInScreen navigation={{ navigate: jest.fn(), replace: jest.fn() }} />);
    expect(getByText(/By continuing, you agree to the/)).toBeTruthy();
    fireEvent.press(getByText('Terms of Service'));
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(TERMS_URL);
    fireEvent.press(getByText('Privacy Policy'));
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(PRIVACY_URL);
  });
});

describe('SignInScreen logs the notice acceptance', () => {
  it('saves a Sign In notice acceptance before Google sign-in starts, and before phone', async () => {
    const navigation = { navigate: jest.fn(), replace: jest.fn() };
    const { getByText } = render(<SignInScreen navigation={navigation} />);
    fireEvent.press(getByText('Continue with Google'));
    await waitFor(() => expect(mockGoogle).toHaveBeenCalled());
    expect(mockSave).toHaveBeenCalledWith('signin_notice');
    expect(mockSave.mock.invocationCallOrder[0]).toBeLessThan(mockGoogle.mock.invocationCallOrder[0]);

    mockSave.mockClear();
    fireEvent.press(getByText('Continue with phone number'));
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('PhoneSignUp'));
    expect(mockSave).toHaveBeenCalledWith('signin_notice');
  });

  it('email sign-in (existing accounts only) logs nothing', () => {
    mockSave.mockClear();
    const { getByText } = render(<SignInScreen navigation={{ navigate: jest.fn(), replace: jest.fn() }} />);
    fireEvent.press(getByText('Sign in'));
    expect(mockSave).not.toHaveBeenCalled();
  });
});

