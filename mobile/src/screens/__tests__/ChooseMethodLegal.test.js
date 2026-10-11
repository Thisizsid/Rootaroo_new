import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));
const mockGoogle = jest.fn();
jest.mock('../../shared/hooks/useGoogleSignIn', () => ({ useGoogleSignIn: () => ({ signIn: mockGoogle, isLoading: false }) }));
jest.mock('../../shared/hooks/useAppleSignIn', () => ({ useAppleSignIn: () => ({ signIn: jest.fn(), isLoading: false }) }));
jest.mock('../../shared/navigation/postAuthNavigation', () => ({
  startPhoneSignupProgress: jest.fn(async () => {}),
  resolvePostAuthNavigation: jest.fn(),
}));
jest.mock('../../shared/store/signupProgress', () => ({ loadSignupProgress: jest.fn() }));
const mockSave = jest.fn(async () => {});
jest.mock('../../shared/legal/pendingAgreement', () => ({
  savePendingAgreement: (...a) => mockSave(...a),
  METHODS: { SIGNUP_CHECKBOX: 'signup_checkbox', SIGNIN_NOTICE: 'signin_notice' },
}));

const ChooseMethodScreen = require('../ChooseMethodScreen').default;

describe('ChooseMethodScreen logs the Terms checkbox', () => {
  beforeEach(() => { mockSave.mockClear(); mockGoogle.mockClear(); });

  it('saves the time the box was ticked, then starts sign-up', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-11T09:00:00Z'));
    const navigation = { navigate: jest.fn(), replace: jest.fn() };
    const { getByLabelText, getByText } = render(<ChooseMethodScreen navigation={navigation} />);
    fireEvent.press(getByLabelText('I agree to the Terms of Service and Privacy Policy'));
    jest.setSystemTime(new Date('2026-10-11T09:00:20Z')); // reads the Terms first, taps later
    fireEvent.press(getByText('Continue with Email'));
    jest.useRealTimers();
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('SignUp'));
    expect(mockSave).toHaveBeenCalledWith('signup_checkbox', new Date('2026-10-11T09:00:00Z'));
  });

  it('logs nothing and blocks sign-up while the box is unticked', async () => {
    const navigation = { navigate: jest.fn(), replace: jest.fn() };
    const { getByText } = render(<ChooseMethodScreen navigation={navigation} />);
    fireEvent.press(getByText('Continue with Email'));
    expect(await waitFor(() => getByText('Please agree to the Terms and Privacy Policy to continue.'))).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
