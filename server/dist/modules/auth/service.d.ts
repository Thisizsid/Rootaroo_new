import type { RegisterBody, LoginBody, AuthResponse, AuthTokens, UserResponse, UpdateProfileBody, GoogleAuthBody, VerifyEmailBody, ForgotPasswordBody, ResetPasswordBody, ScheduleDeletionBody, SendPhoneOtpBody, VerifyPhoneOtpBody, RegisterPhoneBody } from './types';
export declare function register(body: RegisterBody): Promise<AuthResponse>;
export declare function login(body: LoginBody): Promise<AuthResponse>;
export declare function refresh(refreshToken: string): Promise<AuthTokens>;
export declare function logout(refreshToken: string): Promise<void>;
export declare function getProfile(userId: string): Promise<UserResponse>;
export declare function updateProfile(userId: string, body: UpdateProfileBody): Promise<UserResponse>;
export declare function googleAuth(body: GoogleAuthBody): Promise<AuthResponse>;
export declare function sendVerification(userId: string): Promise<string | undefined>;
export declare function verifyEmail(userId: string, body: VerifyEmailBody): Promise<void>;
export declare function forgotPassword(body: ForgotPasswordBody): Promise<void>;
export declare function resetPassword(body: ResetPasswordBody): Promise<void>;
export declare function scheduleDeletion(userId: string, body: ScheduleDeletionBody): Promise<void>;
export declare function cancelDeletion(userId: string): Promise<void>;
export declare function confirmDeletion(userId: string, body: ScheduleDeletionBody): Promise<void>;
export declare function cancelPendingRegistration(userId: string): Promise<void>;
/** Create/login phone user with profile draft, send OTP, return pending tokens. */
export declare function registerPhone(body: RegisterPhoneBody): Promise<AuthResponse>;
export declare function sendPhoneOtp(body: SendPhoneOtpBody, userId?: string): Promise<string | undefined>;
export declare function verifyPhoneOtp(body: VerifyPhoneOtpBody, userId?: string): Promise<AuthResponse>;
//# sourceMappingURL=service.d.ts.map