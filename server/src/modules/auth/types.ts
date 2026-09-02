// ── Request / Response types for auth endpoints

export interface RegisterBody {
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

export interface UpdateProfileBody {
  displayName?: string;
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  avatarPresetId?: string | null;
  dateOfBirth?: string | null;
  homeAddress?: string | null;
  phone?: string | null;
  addToCalendar?: boolean;
  notifyHousehold?: boolean;
}

export interface GoogleAuthBody {
  idToken: string;
}

export interface AppleAuthBody {
  idToken: string;
  displayName?: string;
}

export interface VerifyEmailBody {
  code: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  code: string;
  password: string;
}

export interface CheckResetCodeBody {
  email: string;
  code: string;
}

export interface ScheduleDeletionBody {
  password: string;
}

export interface SendPhoneOtpBody {
  phone: string;
}

export interface VerifyPhoneOtpBody {
  phone: string;
  code: string;
}

export interface RegisterPhoneBody {
  phone: string;
  displayName: string;
  dateOfBirth?: string;
  homeAddress?: string;
  addToCalendar?: boolean;
  notifyHousehold?: boolean;
  avatarUrl?: string | null;
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
  verificationCode?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  avatarPresetId: string | null;
  dateOfBirth: string | null;
  homeAddress: string | null;
  phone: string | null;
  isPhoneVerified: boolean;
  addToCalendar: boolean;
  notifyHousehold: boolean;
  role: string;
  isVerified: boolean;
  createdAt: string;
}
