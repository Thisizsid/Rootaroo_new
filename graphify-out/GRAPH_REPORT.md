# Graph Report - Rootaroo_new  (2026-08-16)

## Corpus Check
- 301 files · ~313,153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1854 nodes · 4474 edges · 168 communities (78 shown, 90 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3fa9551b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- calendar/service.ts
- models/index.ts
- VaultViewerScreen.jsx
- auth/service.ts
- vault/service.ts
- theme/index.js
- dashboard/service.ts
- FeedScreen.jsx
- task/service.ts
- RootNavigator.js
- chat/service.ts
- expense/service.ts
- authStore.js
- HouseholdMember
- useAuthStore
- CheckInScreen.jsx
- notification/service.ts
- Avatar.jsx
- ChatScreen.jsx
- grocery/service.ts
- ExpenseDetailScreen.jsx
- DashboardScreen.jsx
- compilerOptions
- expo
- .eslintrc.json
- auth/routes.ts
- ping/service.ts
- NotificationPreferencesScreen.jsx
- CreateTaskScreen.jsx
- devDependencies
- dependencies
- auth.ts
- errors.ts
- chat/controller.ts
- validate.ts
- scripts
- place/service.ts
- CheckInScreen
- CalendarScreen.jsx
- app.ts
- checkin/service.ts
- WelcomeScreen.jsx
- mobile/package.json
- chat/routes.ts
- chat/types.ts
- expense/controller.ts
- vault/controller.ts
- server/package.json
- place/routes.ts
- calendar/controller.ts
- ping/routes.ts
- task/routes.ts
- dependencies
- calendar/routes.ts
- expense/routes.ts
- feed/routes.ts
- household/routes.ts
- vault/routes.ts
- App.js
- DatePickerModal.jsx
- i18n/index.js
- 20260706-demo-data.js
- metro.config.js
- ReactionPicker.jsx
- restart-dev.sh
- @aws-sdk/lib-storage
- axios
- bcrypt
- dotenv
- expo-build-properties
- expo-camera
- expo-clipboard
- expo-constants
- expo-document-picker
- expo-file-system
- @expo-google-fonts/inter
- @expo-google-fonts/jetbrains-mono
- @expo-google-fonts/plus-jakarta-sans
- expo-image-picker
- expo-linear-gradient
- expo-location
- expo-navigation-bar
- expo-notifications
- expo-screen-capture
- expo-secure-store
- expo-sharing
- expo-status-bar
- @expo/vector-icons
- express
- express-rate-limit
- firebase-admin
- helmet
- husky
- i18next
- ioredis
- jest
- jsonwebtoken
- lint-staged
- @maplibre/maplibre-react-native
- mime-types
- AGENTS.md
- date-fns
- date-fns-tz
- react-dom
- react-i18next
- react-native
- @react-native-community/datetimepicker
- @react-native-community/netinfo
- react-native-pdf
- react-native-qrcode-svg
- react-native-quick-crypto
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-web
- react-native-webview
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-navigation/native-stack
- socket.io-client
- @tanstack/react-query
- zustand
- morgan
- multer
- mysql2
- node-cron
- nodemailer
- rate-limit-redis
- sequelize
- date-fns
- date-fns-tz
- sharp
- slugify
- socket.io
- swagger-jsdoc
- uuid
- winston
- zod
- supertest
- ts-jest
- @types/bcrypt
- @types/cors
- @types/express
- @types/jest
- @types/jsonwebtoken
- @types/mime-types
- @types/multer
- @types/node
- @types/node-cron
- @types/supertest
- @types/swagger-ui-express
- typescript
- @typescript-eslint/parser

## God Nodes (most connected - your core abstractions)
1. `colors` - 72 edges
2. `useAuthStore` - 70 edges
3. `HouseholdMember` - 64 edges
4. `User` - 52 edges
5. `fonts` - 48 edges
6. `withAlpha()` - 47 edges
7. `sequelize` - 43 edges
8. `setupAssociations()` - 36 edges
9. `Avatar()` - 23 edges
10. `apiClient` - 23 edges

## Surprising Connections (you probably didn't know these)
- `StreakRing()` --calls--> `withAlpha()`  [EXTRACTED]
  mobile/src/screens/DashboardScreen.jsx → mobile/src/shared/theme/colors.js
- `VaultUploadScreen()` --references--> `react`  [EXTRACTED]
  mobile/src/screens/VaultUploadScreen.jsx → mobile/package.json
- `MediaCarousel()` --calls--> `resolveUrl()`  [EXTRACTED]
  mobile/src/shared/components/PostCard.jsx → mobile/src/components/Avatar.jsx
- `StorageUsageIndicator()` --calls--> `formatFileSize()`  [EXTRACTED]
  mobile/src/components/StorageUsageIndicator.jsx → mobile/src/shared/utils/format.js
- `GlassTabBar()` --calls--> `withAlpha()`  [EXTRACTED]
  mobile/src/navigation/RootNavigator.js → mobile/src/shared/theme/colors.js

## Import Cycles
- None detected.

## Communities (168 total, 90 thin omitted)

### Community 0 - "calendar/service.ts"
Cohesion: 0.06
Nodes (71): RFC-5545, testDatabaseConnection(), env, s3Client, s3Config, CalendarEvent, CalendarSyncState, EventInvitee (+63 more)

### Community 1 - "models/index.ts"
Cohesion: 0.06
Nodes (44): sequelize, CommentReaction, EmailVerification, FeedComment, FeedLike, FeedPost, models, setupAssociations() (+36 more)

### Community 2 - "VaultViewerScreen.jsx"
Cohesion: 0.06
Nodes (63): plugins, StorageUsageIndicator(), styles, documentType(), formatLockTime(), VaultListScreen(), styles, VaultSetupScreen() (+55 more)

### Community 3 - "auth/service.ts"
Cohesion: 0.05
Nodes (48): RefreshToken, updateProfile(), uploadAvatarCtrl(), cancelDeletion(), cancelPendingRegistration(), confirmDeletion(), forgotPassword(), generateAccessToken() (+40 more)

### Community 4 - "vault/service.ts"
Cohesion: 0.08
Nodes (55): VaultDocument, VaultDocumentKey, VaultKey, addComment(), create(), getById(), getUserId(), getUserRole() (+47 more)

### Community 5 - "theme/index.js"
Cohesion: 0.08
Nodes (39): QrScannerModal(), styles, DOTS, EmailVerificationScreen(), styles, styles, FAMILY_EMOJIS, HouseholdSetupScreen() (+31 more)

### Community 6 - "dashboard/service.ts"
Cohesion: 0.09
Nodes (43): TodoItem, ActivityTotals, buildActivity(), buildLeaderboard(), computeEngagement(), computeStreak(), dateKey(), daysAgo() (+35 more)

### Community 7 - "FeedScreen.jsx"
Cohesion: 0.08
Nodes (35): ConfirmSheet(), styles, EmptyState(), styles, ErrorState(), styles, LoadingSkeleton(), styles (+27 more)

### Community 8 - "task/service.ts"
Cohesion: 0.11
Nodes (38): Task, TaskAssignee, complete(), create(), getById(), getUserId(), getUserRole(), list() (+30 more)

### Community 9 - "RootNavigator.js"
Cohesion: 0.06
Nodes (25): AuthStack, ChatNav, GlassTabBar(), INACTIVE, MainNavigator(), MainTab, MoreNav, RootNavigator() (+17 more)

### Community 10 - "chat/service.ts"
Cohesion: 0.17
Nodes (36): ChatMessage, ChatReaction, Conversation, ConversationParticipant, FeedMedia, addParticipant(), addReaction(), ALLOWED_REACTIONS (+28 more)

### Community 11 - "expense/service.ts"
Cohesion: 0.13
Nodes (35): Expense, ExpenseParticipant, Settlement, computeSimplifiedLedger(), createExpense(), deleteExpense(), getExpenseById(), getExpenseSummary() (+27 more)

### Community 12 - "authStore.js"
Cohesion: 0.12
Nodes (20): ChooseMethodScreen(), styles, styles, SignInScreen(), styles, SignUpScreen(), styles, authApi (+12 more)

### Community 13 - "HouseholdMember"
Cohesion: 0.16
Nodes (34): Household, HouseholdMember, Invitation, User, assertAdminWithPassword(), cancelHouseholdDeletion(), changeMemberRole(), confirmHouseholdDeletion() (+26 more)

### Community 14 - "useAuthStore"
Cohesion: 0.10
Nodes (28): AccountDeletionScreen(), styles, CommentsScreen(), initialsOf(), REACTIONS, styles, timeAgo(), ACTIVITIES (+20 more)

### Community 15 - "CheckInScreen.jsx"
Cohesion: 0.08
Nodes (22): PLACE_ICON_EMOJI, PLACE_ICON_OPTIONS, styles, TRAY_EXPANDED_HEIGHT, GROCERY_SECTIONS, GroceryListScreen(), sheet, styles (+14 more)

### Community 16 - "notification/service.ts"
Cohesion: 0.12
Nodes (29): DeviceToken, NotificationHistory, NotificationPreference, getHistory(), getPreferences(), getUnreadCount(), getUserId(), markAsRead() (+21 more)

### Community 17 - "Avatar.jsx"
Cohesion: 0.09
Nodes (25): Avatar(), AVATAR_FALLBACKS, avatarTone(), getInitials(), getServerBase(), resolveUrl(), styles, MessageBubble() (+17 more)

### Community 18 - "ChatScreen.jsx"
Cohesion: 0.11
Nodes (24): ChatInputBar(), styles, styles, ThreadedReplyPreview(), styles, TypingIndicator(), ChatScreen(), formatDateDivider() (+16 more)

### Community 19 - "grocery/service.ts"
Cohesion: 0.15
Nodes (27): GroceryItem, archive(), create(), getUserId(), getUserRole(), list(), remove(), summary() (+19 more)

### Community 20 - "ExpenseDetailScreen.jsx"
Cohesion: 0.13
Nodes (23): CreateExpenseScreen(), formatDateLabel(), SPLIT_OPTIONS, styles, ExpenseDetailScreen(), formatMoney(), styles, ExpenseLedgerScreen() (+15 more)

### Community 21 - "DashboardScreen.jsx"
Cohesion: 0.10
Nodes (21): CreateEventScreen(), REPEAT_OPTIONS, styles, DashboardScreen(), FAMILY_COVER, formatDate(), getGreeting(), GLASS_BORDER (+13 more)

### Community 22 - "compilerOptions"
Cohesion: 0.07
Nodes (27): ES2022, src/**/*.ts, __tests__, compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop (+19 more)

### Community 23 - "expo"
Cohesion: 0.08
Nodes (24): backgroundColor, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, backgroundColor, barStyle, expo (+16 more)

### Community 24 - ".eslintrc.json"
Cohesion: 0.08
Nodes (24): coverage/, eslint:recommended, plugin:@typescript-eslint/recommended, @typescript-eslint, warn, env, es2022, node (+16 more)

### Community 25 - "auth/routes.ts"
Cohesion: 0.13
Nodes (22): forgotPasswordSchema, googleAuthSchema, loginSchema, logoutSchema, refreshSchema, registerPhoneSchema, registerSchema, resetPasswordSchema (+14 more)

### Community 26 - "ping/service.ts"
Cohesion: 0.16
Nodes (19): PingRequest, createPingRequest(), getUserHousehold(), INCLUDE_USERS, listPingRequests(), loadFull(), respondToPingRequest(), toPingRequestResponse() (+11 more)

### Community 27 - "NotificationPreferencesScreen.jsx"
Cohesion: 0.13
Nodes (17): PreferenceToggle(), styles, ACTIVITY_ROWS, ALL_PREF_KEYS, DEFAULT_PREFS, NotificationPreferencesScreen(), REMINDER_ROWS, styles (+9 more)

### Community 28 - "CreateTaskScreen.jsx"
Cohesion: 0.14
Nodes (14): cal, CalendarPicker(), CreateTaskScreen(), DAY_LABELS, displayDate(), MONTH_NAMES, RECURRENCE_OPTIONS, styles (+6 more)

### Community 29 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, nodemon, prettier, devDependencies, eslint, nodemon, prettier, tsx (+11 more)

### Community 30 - "dependencies"
Cohesion: 0.11
Nodes (19): expo, expo-auth-session, expo-av, expo-blur, expo-crypto, expo-font, expo-web-browser, lottie-react-native (+11 more)

### Community 31 - "auth.ts"
Cohesion: 0.18
Nodes (10): create(), getUserId(), list(), listByMember(), router, checkInQuerySchema, createCheckInSchema, authenticate() (+2 more)

### Community 32 - "errors.ts"
Cohesion: 0.16
Nodes (10): getDashboard(), getUserHousehold(), quickNotify(), modelsMock, AppError, ConflictError, ForbiddenError, NotFoundError (+2 more)

### Community 33 - "chat/controller.ts"
Cohesion: 0.24
Nodes (16): addParticipantCtrl(), addReactionCtrl(), createConversationCtrl(), deleteConversationCtrl(), deleteMessageCtrl(), getMessageByIdCtrl(), getUserConversationsCtrl(), getUserId() (+8 more)

### Community 34 - "validate.ts"
Cohesion: 0.23
Nodes (10): router, createGrocerySchema, updateGrocerySchema, router, deviceTokenSchema, updatePreferencesSchema, createTodoSchema, updateTodoSchema (+2 more)

### Community 35 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:migrate, db:migrate:undo, db:seed, db:seed:undo, dev, format (+8 more)

### Community 36 - "place/service.ts"
Cohesion: 0.26
Nodes (12): SavedPlace, createSavedPlace(), deleteSavedPlace(), getUserHousehold(), listSavedPlaces(), toSavedPlaceResponse(), updateSavedPlace(), modelsMock (+4 more)

### Community 37 - "CheckInScreen"
Cohesion: 0.15
Nodes (13): react, CheckInScreen(), clamp(), timeLabel(), KNOWS, LOCATION, MEDIA, NOTIFICATION (+5 more)

### Community 38 - "CalendarScreen.jsx"
Cohesion: 0.24
Nodes (13): buildMonthGrid(), CalendarScreen(), eventTimeLabel(), isSameDay(), nextBirthday(), styles, timeGroupLabel(), todayEventCount() (+5 more)

### Community 39 - "app.ts"
Cohesion: 0.15
Nodes (11): app, authLimiter, generalLimiter, redis, options, swaggerSpec, router, router (+3 more)

### Community 40 - "checkin/service.ts"
Cohesion: 0.29
Nodes (12): CheckIn, createCheckIn(), getUserHousehold(), listCheckIns(), listMemberCheckIns(), toCheckInResponse(), mockCheckIn, mockUser (+4 more)

### Community 41 - "WelcomeScreen.jsx"
Cohesion: 0.18
Nodes (10): HoppingKangarooMark(), styles, LOOP_SLIDES, OrganizeHero(), SecurityHero(), SLIDES, styles, useBreathe() (+2 more)

### Community 42 - "mobile/package.json"
Cohesion: 0.15
Nodes (12): devDependencies, @react-native-community/cli, main, name, private, scripts, android, ios (+4 more)

### Community 43 - "chat/routes.ts"
Cohesion: 0.29
Nodes (11): addParticipantSchema, conversationIdParamSchema, createConversationSchema, createMessageSchema, deleteReactionSchema, messageIdParamSchema, messageQuerySchema, reactionSchema (+3 more)

### Community 44 - "chat/types.ts"
Cohesion: 0.15
Nodes (12): AddParticipantBody, ChatReactionType, ConversationResponse, CreateConversationBody, CreateMessageBody, MessageQuery, MessageResponse, MessageSenderResponse (+4 more)

### Community 45 - "expense/controller.ts"
Cohesion: 0.32
Nodes (12): createExpenseCtrl(), deleteExpenseCtrl(), getExpenseByIdCtrl(), getExpenseSummaryCtrl(), getLedgerCtrl(), getUserId(), getUserRole(), listExpensesCtrl() (+4 more)

### Community 46 - "vault/controller.ts"
Cohesion: 0.32
Nodes (12): deleteDocumentCtrl(), getDocumentByIdCtrl(), getDocumentKeyCtrl(), getStorageUsageCtrl(), getUserId(), getUserKeyCtrl(), getUserRole(), hardDeleteDocumentCtrl() (+4 more)

### Community 47 - "server/package.json"
Cohesion: 0.17
Nodes (11): eslint --fix, prettier --write, author, description, license, lint-staged, *.ts, main (+3 more)

### Community 48 - "place/routes.ts"
Cohesion: 0.26
Nodes (9): create(), getUserId(), list(), remove(), update(), router, createSavedPlaceSchema, iconEnum (+1 more)

### Community 49 - "calendar/controller.ts"
Cohesion: 0.35
Nodes (10): create(), exportIcs(), getById(), getUserId(), googleConnect(), googleDisconnect(), googleStatus(), list() (+2 more)

### Community 50 - "ping/routes.ts"
Cohesion: 0.29
Nodes (8): create(), getUserId(), list(), respond(), router, createPingRequestSchema, pingQuerySchema, respondPingRequestSchema

### Community 51 - "task/routes.ts"
Cohesion: 0.25
Nodes (7): router, createTaskSchema, taskQuerySchema, updateTaskSchema, requireRole(), Role, roleHierarchy

### Community 52 - "dependencies"
Cohesion: 0.22
Nodes (9): @aws-sdk/client-s3, cloudinary, cors, dependencies, @aws-sdk/client-s3, cloudinary, cors, swagger-ui-express (+1 more)

### Community 53 - "calendar/routes.ts"
Cohesion: 0.39
Nodes (6): router, connectGoogleCalendarSchema, createEventSchema, isoDateTime, listEventsQuerySchema, updateEventSchema

### Community 54 - "expense/routes.ts"
Cohesion: 0.43
Nodes (6): router, createExpenseSchema, expenseQuerySchema, markSettledSchema, settlementSchema, updateExpenseSchema

### Community 55 - "feed/routes.ts"
Cohesion: 0.39
Nodes (6): router, commentQuerySchema, createCommentSchema, createPostSchema, feedQuerySchema, updatePostSchema

### Community 56 - "household/routes.ts"
Cohesion: 0.43
Nodes (6): router, changeMemberRoleSchema, createHouseholdSchema, joinHouseholdSchema, scheduleHouseholdDeletionSchema, transferAdminSchema

### Community 57 - "vault/routes.ts"
Cohesion: 0.39
Nodes (6): vaultUpload, router, createVaultDocumentSchema, storeUserKeySchema, updateVaultDocumentSchema, vaultDocumentQuerySchema

### Community 58 - "App.js"
Cohesion: 0.43
Nodes (3): App(), queryClient, useAppFonts()

### Community 59 - "DatePickerModal.jsx"
Cohesion: 0.48
Nodes (6): clampDay(), DatePickerModal(), daysInMonth(), formatDate(), MONTH_NAMES, styles

### Community 60 - "i18n/index.js"
Cohesion: 0.47
Nodes (3): en, options, ne

### Community 61 - "20260706-demo-data.js"
Cohesion: 0.33
Nodes (3): bcrypt, now, { v4: uuidv4 }

### Community 62 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, path, ZUSTAND_ROOT

## Knowledge Gaps
- **422 isolated node(s):** `queryClient`, `name`, `slug`, `scheme`, `version` (+417 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **90 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@react-navigation/native-stack`, `socket.io-client`, `@tanstack/react-query`, `zustand`, `CheckInScreen`, `mobile/package.json`, `axios`, `expo-build-properties`, `expo-camera`, `expo-clipboard`, `expo-constants`, `expo-document-picker`, `expo-file-system`, `@expo-google-fonts/inter`, `@expo-google-fonts/jetbrains-mono`, `@expo-google-fonts/plus-jakarta-sans`, `expo-image-picker`, `expo-linear-gradient`, `expo-location`, `expo-navigation-bar`, `expo-notifications`, `expo-screen-capture`, `expo-secure-store`, `expo-sharing`, `expo-status-bar`, `@expo/vector-icons`, `i18next`, `@maplibre/maplibre-react-native`, `date-fns`, `date-fns-tz`, `react-dom`, `react-i18next`, `react-native`, `@react-native-community/datetimepicker`, `@react-native-community/netinfo`, `react-native-pdf`, `react-native-qrcode-svg`, `react-native-quick-crypto`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `react-native-web`, `react-native-webview`, `@react-navigation/bottom-tabs`, `@react-navigation/native`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `react` connect `CheckInScreen` to `VaultViewerScreen.jsx`, `dependencies`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `CheckInScreen()` connect `CheckInScreen` to `RootNavigator.js`, `useAuthStore`, `CheckInScreen.jsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `queryClient`, `name`, `slug` to the rest of the system?**
  _422 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `calendar/service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05539971949509116 - nodes in this community are weakly interconnected._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06486210418794688 - nodes in this community are weakly interconnected._
- **Should `VaultViewerScreen.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058416139716952725 - nodes in this community are weakly interconnected._