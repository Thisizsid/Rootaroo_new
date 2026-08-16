import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { ActivityIndicator, Platform, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../shared/store/authStore';
import { connectSocket, disconnectSocket } from '../shared/socket';
import { registerForPushNotificationsAsync } from '../shared/pushNotifications';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ChooseMethodScreen from '../screens/ChooseMethodScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import HouseholdSetupScreen from '../screens/HouseholdSetupScreen';
import InviteMembersScreen from '../screens/InviteMembersScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import PhoneSignUpScreen from '../screens/PhoneSignUpScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';
import SignupStepNameScreen from '../screens/SignupStepNameScreen';
import SignupStepBirthdayScreen from '../screens/SignupStepBirthdayScreen';
import SignupStepPhoneScreen from '../screens/SignupStepPhoneScreen';
import SignupStepAddressScreen from '../screens/SignupStepAddressScreen';
import SignupStepAvatarScreen from '../screens/SignupStepAvatarScreen';
import ReadyScreen from '../screens/ReadyScreen';
import AccountDeletionScreen from '../screens/AccountDeletionScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import HouseholdSettingsScreen from '../screens/HouseholdSettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CheckInScreen from '../screens/CheckInScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import MoreScreen from '../screens/MoreScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FeedScreen from '../screens/FeedScreen';
import CommentsScreen from '../screens/CommentsScreen';

import TaskListScreen from '../screens/TaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';

import GroceryListScreen from '../screens/GroceryListScreen';
import NotificationScreen from '../screens/NotificationScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import ExpenseLedgerScreen from '../screens/ExpenseLedgerScreen';
import ExpenseSettlementScreen from '../screens/ExpenseSettlementScreen';
import CreateExpenseScreen from '../screens/CreateExpenseScreen';

import VaultUploadScreen from '../screens/VaultUploadScreen';
import VaultSetupScreen from '../screens/VaultSetupScreen';
import VaultViewerScreen from '../screens/VaultViewerScreen';
import VaultListScreen from '../screens/VaultListScreen';
import ChatScreen from '../screens/ChatScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import { colors, withAlpha } from '../shared/theme';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const TasksNav = createNativeStackNavigator();
const ChatNav = createNativeStackNavigator();
const MoreNav = createNativeStackNavigator();

/* Vault screens are a fully immersive dark experience — no floating tab dock. */
const VAULT_ROUTES = ['Vault', 'VaultUpload', 'VaultSetup', 'VaultViewer'];


function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="ChooseMethod" component={ChooseMethodScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="PhoneSignUp" component={PhoneSignUpScreen} />
      <AuthStack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <AuthStack.Screen name="SignupStepName" component={SignupStepNameScreen} />
      <AuthStack.Screen name="SignupStepBirthday" component={SignupStepBirthdayScreen} />
      <AuthStack.Screen name="SignupStepPhone" component={SignupStepPhoneScreen} />
      <AuthStack.Screen name="SignupStepAddress" component={SignupStepAddressScreen} />
      <AuthStack.Screen name="SignupStepAvatar" component={SignupStepAvatarScreen} />
      <AuthStack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
      <AuthStack.Screen name="InviteMembers" component={InviteMembersScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <AuthStack.Screen name="Ready" component={ReadyScreen} />
    </AuthStack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatNav.Navigator screenOptions={{ headerShown: false }}>
      <ChatNav.Screen name="Conversations" component={ConversationsScreen} />
      <ChatNav.Screen name="ChatScreen" component={ChatScreen} />
      <ChatNav.Screen name="GroupMembers" component={GroupMembersScreen} />
    </ChatNav.Navigator>
  );
}

function TasksNavigator() {
  return (
    <TasksNav.Navigator screenOptions={{ headerShown: false }}>
      <TasksNav.Screen name="TaskList" component={TaskListScreen} />
      <TasksNav.Screen name="TaskDetail" component={TaskDetailScreen} />
      <TasksNav.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ headerShown: false, presentation: 'transparentModal' }}
      />
    </TasksNav.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreNav.Navigator screenOptions={{ headerShown: false }}>
      <MoreNav.Screen name="MoreIndex" component={MoreScreen} />
      <MoreNav.Screen name="HouseholdSettings" component={HouseholdSettingsScreen} />
      <MoreNav.Screen name="GroceryList" component={GroceryListScreen} />
      <MoreNav.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ headerShown: false, presentation: 'transparentModal' }}
      />
      <MoreNav.Screen name="ExpenseList" component={ExpenseListScreen} />
      <MoreNav.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <MoreNav.Screen name="ExpenseLedger" component={ExpenseLedgerScreen} />
      <MoreNav.Screen name="ExpenseSettlements" component={ExpenseSettlementScreen} />
      <MoreNav.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <MoreNav.Screen name="Vault" component={VaultListScreen} />
      <MoreNav.Screen
        name="VaultUpload"
        component={VaultUploadScreen}
        options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
      <MoreNav.Screen name="VaultSetup" component={VaultSetupScreen} />
      <MoreNav.Screen name="VaultViewer" component={VaultViewerScreen} />
      <MoreNav.Screen name="Calendar" component={CalendarScreen} />
      <MoreNav.Screen name="CheckIn" component={CheckInScreen} />
      <MoreNav.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
      <MoreNav.Screen name="EditProfile" component={EditProfileScreen} />
      <MoreNav.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <MoreNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <MoreNav.Screen name="HelpCenter" component={HelpCenterScreen} />
      <MoreNav.Screen name="PostDetail" component={PostDetailScreen} />
    </MoreNav.Navigator>
  );
}

/* ── Design system tokens (mockup 03-Home-Feed) ── */
const INK = colors.ink;
const GOLD = colors.gold;
const INACTIVE = withAlpha(colors.ink, 0.45);

/* ── Tab icon components (View-based, no emoji) ── */

function TabDot({ color }) {
  return <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 3 }} />;
}

function TabHomeIcon({ color, focused }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {focused && <TabDot color={color} />}
      <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color, position: 'absolute', top: 1 }} />
        <View style={{ width: 13, height: 11, borderWidth: 1.5, borderColor: color, borderRadius: 1.5, marginTop: 5 }} />
      </View>
    </View>
  );
}

function TabFeedIcon({ color, focused }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {focused && <TabDot color={color} />}
      <View style={{ width: 16, height: 16, borderWidth: 1.5, borderColor: color, borderRadius: 3, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <View style={{ width: 9, height: 1.5, backgroundColor: color, borderRadius: 0.75 }} />
        <View style={{ width: 9, height: 1.5, backgroundColor: color, borderRadius: 0.75 }} />
        <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 0.75 }} />
      </View>
    </View>
  );
}

function TabChatIcon({ color, focused }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {focused && <TabDot color={color} />}
      <View style={{ width: 18, height: 16, borderWidth: 1.5, borderColor: color, borderRadius: 5, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <View style={{ width: 8, height: 1.5, backgroundColor: color, borderRadius: 0.75, marginBottom: 3 }} />
        <View style={{ width: 12, height: 1.5, backgroundColor: color, borderRadius: 0.75 }} />
        {/* Bubble tail */}
        <View style={{ position: 'absolute', bottom: -3, left: 5, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color }} />
      </View>
    </View>
  );
}

function TabTasksIcon({ color, focused }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {focused && <TabDot color={color} />}
      <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: color, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 5, height: 9, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: color, transform: [{ rotate: '45deg' }], marginTop: -2 }} />
      </View>
    </View>
  );
}

function TabMoreIcon({ color, focused }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {focused && <TabDot color={color} />}
      <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
        ))}
      </View>
    </View>
  );
}

/* ── Main tab navigator ── */

/* Modern floating glass dock tab bar (mockup-inspired, design-system tokens) */
function GlassTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // Hide the dock when a tab-nested screen opts out (e.g. Notification preferences)
  const moreRoute = state.routes.find((r) => r.name === 'MoreStack');
  const nested = moreRoute && moreRoute.state && moreRoute.state.routes
    ? getFocusedRouteNameFromRoute(moreRoute)
    : undefined;
  const hidden = nested === 'NotificationPreferences' || (!!nested && VAULT_ROUTES.includes(nested));
  if (hidden) return null;

  const dark = !!nested && VAULT_ROUTES.includes(nested);

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: 0, right: 0, bottom: 5,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingHorizontal: 14,
          paddingTop: 8,
          backgroundColor: 'transparent',
        },
      ]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={80}
        tint={dark ? 'dark' : 'light'}
        style={{
          flexDirection: 'row',
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: dark ? colors.gold : withAlpha(colors.white, 0.65),
          backgroundColor: dark ? withAlpha(colors.overlaySlate, 0.88) : withAlpha(colors.white, 0.72),
          shadowColor: dark ? colors.black : INK,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: dark ? 0.4 : 0.12,
          shadowRadius: 24,
          elevation: 14,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const color = isFocused
            ? GOLD
            : (dark ? withAlpha(colors.white, 0.55) : INACTIVE);

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,

                gap: 3,
              }}
              activeOpacity={0.75}
            >
              {/* Active gold pill behind icon */}
              <View
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  //

                }}
              >
                {options.tabBarIcon ? options.tabBarIcon({ color, focused: isFocused, size: 22 }) : null}
              </View>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: isFocused ? '700' : '600',
                  letterSpacing: 0.1,
                  color: isFocused
                    ? (dark ? colors.surface : INK)
                    : (dark ? withAlpha(colors.white, 0.5) : INACTIVE),
                  fontFamily: isFocused ? 'PlusJakartaSans_700Bold' : 'Inter_600SemiBold',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

function MainNavigator() {
  const tabBarStyle = {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    height: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setBackgroundColorAsync(colors.surface);
    NavigationBar.setButtonStyleAsync('dark');
  }, []);

  return (
    <MainTab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          textTransform: 'none',
        },
      }}
    >
      <MainTab.Screen
        name="KnowsDashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <TabHomeIcon color={color} focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="FeedStack"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, focused }) => <TabFeedIcon color={color} focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="ChatStack"
        component={ChatNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);
          // Full-screen chat: hide the floating tab bar so it never covers the input
          const hideTab = routeName === 'ChatScreen';
          return {
            tabBarLabel: 'Chat',
            tabBarStyle: hideTab ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, focused }) => <TabChatIcon color={color} focused={focused} />,
          };
        }}
      />
      <MainTab.Screen
        name="TasksStack"
        component={TasksNavigator}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, focused }) => <TabTasksIcon color={color} focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="MoreStack"
        component={MoreNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);
          const hideTab = routeName === 'NotificationPreferences' || (!!routeName && VAULT_ROUTES.includes(routeName));
          return {
            tabBarLabel: 'More',
            tabBarStyle: hideTab ? { display: 'none' } : tabBarStyle,
            tabBarIcon: ({ color, focused }) => <TabMoreIcon color={color} focused={focused} />,
          };
        }}
        listeners={({ navigation: tabNav }) => ({
          tabPress: (e) => {
            const state = tabNav.getState();
            const moreIndex = state.routes.findIndex((r) => r.name === 'MoreStack');
            if (state.index === moreIndex) {
              e.preventDefault();
              tabNav.navigate('MoreStack', { screen: 'MoreIndex' });
            }
          },
        })}
      />
    </MainTab.Navigator>
  );
}

export default function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const [minSplashDone, setMinSplashDone] = useState(false);

  // Restore auth from SecureStore on boot
  useEffect(() => { restoreSession(); }, [restoreSession]);

  // Enforce minimum 3s splash display so the brand animation is seen
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Socket lifecycle
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
      registerForPushNotificationsAsync();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, accessToken]);

  if (isLoading || !minSplashDone) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <RootStack.Navigator screenOptions={{ presentation: 'modal', headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainNavigator} />
      <RootStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <RootStack.Screen name="Comments" component={CommentsScreen} />
      <RootStack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </RootStack.Navigator>
  );
}
