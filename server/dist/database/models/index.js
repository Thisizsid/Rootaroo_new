"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceToken = exports.NotificationHistory = exports.NotificationPreference = exports.CalendarSyncState = exports.CalendarEvent = exports.CheckIn = exports.ChatReaction = exports.ChatMessage = exports.VaultDocumentKey = exports.VaultKey = exports.VaultDocument = exports.Settlement = exports.ExpenseParticipant = exports.Expense = exports.TodoItem = exports.GroceryItem = exports.TaskAssignee = exports.Task = exports.ConversationParticipant = exports.Conversation = exports.PostTag = exports.FeedMedia = exports.FeedComment = exports.FeedLike = exports.FeedPost = exports.Invitation = exports.HouseholdMember = exports.Household = exports.PhoneVerification = exports.PasswordReset = exports.EmailVerification = exports.RefreshToken = exports.User = exports.Sequelize = exports.sequelize = void 0;
exports.setupAssociations = setupAssociations;
const sequelize_1 = require("sequelize");
Object.defineProperty(exports, "Sequelize", { enumerable: true, get: function () { return sequelize_1.Sequelize; } });
const database_1 = __importDefault(require("../../config/database"));
exports.sequelize = database_1.default;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const RefreshToken_1 = __importDefault(require("./RefreshToken"));
exports.RefreshToken = RefreshToken_1.default;
const EmailVerification_1 = __importDefault(require("./EmailVerification"));
exports.EmailVerification = EmailVerification_1.default;
const PasswordReset_1 = __importDefault(require("./PasswordReset"));
exports.PasswordReset = PasswordReset_1.default;
const Household_1 = __importDefault(require("./Household"));
exports.Household = Household_1.default;
const HouseholdMember_1 = __importDefault(require("./HouseholdMember"));
exports.HouseholdMember = HouseholdMember_1.default;
const Invitation_1 = __importDefault(require("./Invitation"));
exports.Invitation = Invitation_1.default;
const FeedPost_1 = __importDefault(require("./FeedPost"));
exports.FeedPost = FeedPost_1.default;
const FeedLike_1 = __importDefault(require("./FeedLike"));
exports.FeedLike = FeedLike_1.default;
const FeedComment_1 = __importDefault(require("./FeedComment"));
exports.FeedComment = FeedComment_1.default;
const FeedMedia_1 = __importDefault(require("./FeedMedia"));
exports.FeedMedia = FeedMedia_1.default;
const Task_1 = __importDefault(require("./Task"));
exports.Task = Task_1.default;
const TaskAssignee_1 = __importDefault(require("./TaskAssignee"));
exports.TaskAssignee = TaskAssignee_1.default;
const GroceryItem_1 = __importDefault(require("./GroceryItem"));
exports.GroceryItem = GroceryItem_1.default;
const TodoItem_1 = __importDefault(require("./TodoItem"));
exports.TodoItem = TodoItem_1.default;
const Expense_1 = __importDefault(require("./Expense"));
exports.Expense = Expense_1.default;
const ExpenseParticipant_1 = __importDefault(require("./ExpenseParticipant"));
exports.ExpenseParticipant = ExpenseParticipant_1.default;
const Settlement_1 = __importDefault(require("./Settlement"));
exports.Settlement = Settlement_1.default;
const VaultDocument_1 = __importDefault(require("./VaultDocument"));
exports.VaultDocument = VaultDocument_1.default;
const VaultKey_1 = __importDefault(require("./VaultKey"));
exports.VaultKey = VaultKey_1.default;
const VaultDocumentKey_1 = __importDefault(require("./VaultDocumentKey"));
exports.VaultDocumentKey = VaultDocumentKey_1.default;
const ChatMessage_1 = __importDefault(require("./ChatMessage"));
exports.ChatMessage = ChatMessage_1.default;
const ChatReaction_1 = __importDefault(require("./ChatReaction"));
exports.ChatReaction = ChatReaction_1.default;
const CheckIn_1 = __importDefault(require("./CheckIn"));
exports.CheckIn = CheckIn_1.default;
const CalendarEvent_1 = __importDefault(require("./CalendarEvent"));
exports.CalendarEvent = CalendarEvent_1.default;
const CalendarSyncState_1 = __importDefault(require("./CalendarSyncState"));
exports.CalendarSyncState = CalendarSyncState_1.default;
const NotificationPreference_1 = __importDefault(require("./NotificationPreference"));
exports.NotificationPreference = NotificationPreference_1.default;
const NotificationHistory_1 = __importDefault(require("./NotificationHistory"));
exports.NotificationHistory = NotificationHistory_1.default;
const DeviceToken_1 = __importDefault(require("./DeviceToken"));
exports.DeviceToken = DeviceToken_1.default;
const PhoneVerification_1 = __importDefault(require("./PhoneVerification"));
exports.PhoneVerification = PhoneVerification_1.default;
const PostTag_1 = __importDefault(require("./PostTag"));
exports.PostTag = PostTag_1.default;
const Conversation_1 = __importDefault(require("./Conversation"));
exports.Conversation = Conversation_1.default;
const ConversationParticipant_1 = __importDefault(require("./ConversationParticipant"));
exports.ConversationParticipant = ConversationParticipant_1.default;
const models = {
    User: User_1.default,
    RefreshToken: RefreshToken_1.default,
    EmailVerification: EmailVerification_1.default,
    PasswordReset: PasswordReset_1.default,
    PhoneVerification: PhoneVerification_1.default,
    Household: Household_1.default,
    HouseholdMember: HouseholdMember_1.default,
    Invitation: Invitation_1.default,
    FeedPost: FeedPost_1.default,
    FeedLike: FeedLike_1.default,
    FeedComment: FeedComment_1.default,
    FeedMedia: FeedMedia_1.default,
    PostTag: PostTag_1.default,
    Conversation: Conversation_1.default,
    ConversationParticipant: ConversationParticipant_1.default,
    Task: Task_1.default,
    TaskAssignee: TaskAssignee_1.default,
    GroceryItem: GroceryItem_1.default,
    TodoItem: TodoItem_1.default,
    Expense: Expense_1.default,
    ExpenseParticipant: ExpenseParticipant_1.default,
    Settlement: Settlement_1.default,
    VaultDocument: VaultDocument_1.default,
    VaultKey: VaultKey_1.default,
    VaultDocumentKey: VaultDocumentKey_1.default,
    ChatMessage: ChatMessage_1.default,
    ChatReaction: ChatReaction_1.default,
    CheckIn: CheckIn_1.default,
    CalendarEvent: CalendarEvent_1.default,
    CalendarSyncState: CalendarSyncState_1.default,
    NotificationPreference: NotificationPreference_1.default,
    NotificationHistory: NotificationHistory_1.default,
    DeviceToken: DeviceToken_1.default,
};
function setupAssociations() {
    // ── User associations ──
    User_1.default.hasMany(RefreshToken_1.default, { foreignKey: 'user_id', as: 'refreshTokens' });
    RefreshToken_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasMany(EmailVerification_1.default, { foreignKey: 'user_id', as: 'emailVerifications' });
    EmailVerification_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasMany(PhoneVerification_1.default, { foreignKey: 'user_id', as: 'phoneVerifications' });
    PhoneVerification_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasMany(PasswordReset_1.default, { foreignKey: 'user_id', as: 'passwordResets' });
    PasswordReset_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasOne(NotificationPreference_1.default, { foreignKey: 'user_id', as: 'notificationPreferences' });
    NotificationPreference_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasMany(NotificationHistory_1.default, { foreignKey: 'user_id', as: 'notificationHistory' });
    NotificationHistory_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasMany(CalendarSyncState_1.default, { foreignKey: 'user_id', as: 'calendarSyncStates' });
    CalendarSyncState_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    // ── Household associations ──
    Household_1.default.hasMany(HouseholdMember_1.default, { foreignKey: 'household_id', as: 'members' });
    HouseholdMember_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    HouseholdMember_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    Household_1.default.hasMany(Invitation_1.default, { foreignKey: 'household_id', as: 'invitations' });
    Invitation_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Invitation_1.default.belongsTo(User_1.default, { foreignKey: 'invited_by', as: 'inviter' });
    Household_1.default.hasMany(FeedPost_1.default, { foreignKey: 'household_id', as: 'feedPosts' });
    FeedPost_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(Task_1.default, { foreignKey: 'household_id', as: 'tasks' });
    Task_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(Expense_1.default, { foreignKey: 'household_id', as: 'expenses' });
    Expense_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(ChatMessage_1.default, { foreignKey: 'household_id', as: 'chatMessages' });
    ChatMessage_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(CalendarEvent_1.default, { foreignKey: 'household_id', as: 'calendarEvents' });
    CalendarEvent_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(CheckIn_1.default, { foreignKey: 'household_id', as: 'checkIns' });
    CheckIn_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(GroceryItem_1.default, { foreignKey: 'household_id', as: 'groceryItems' });
    GroceryItem_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(TodoItem_1.default, { foreignKey: 'household_id', as: 'todoItems' });
    TodoItem_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(VaultDocument_1.default, { foreignKey: 'household_id', as: 'vaultDocuments' });
    VaultDocument_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(VaultKey_1.default, { foreignKey: 'household_id', as: 'vaultKeys' });
    VaultKey_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(Settlement_1.default, { foreignKey: 'household_id', as: 'settlements' });
    Settlement_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    // ── User ↔ Household (many-to-many via HouseholdMember) ──
    User_1.default.belongsToMany(Household_1.default, { through: HouseholdMember_1.default, foreignKey: 'user_id', otherKey: 'household_id', as: 'households' });
    Household_1.default.belongsToMany(User_1.default, { through: HouseholdMember_1.default, foreignKey: 'household_id', otherKey: 'user_id', as: 'users' });
    // ── Feed associations ──
    FeedPost_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'author' });
    User_1.default.hasMany(FeedPost_1.default, { foreignKey: 'user_id', as: 'posts' });
    FeedPost_1.default.hasMany(FeedLike_1.default, { foreignKey: 'post_id', as: 'likes' });
    FeedLike_1.default.belongsTo(FeedPost_1.default, { foreignKey: 'post_id', as: 'post' });
    FeedLike_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    FeedPost_1.default.hasMany(FeedComment_1.default, { foreignKey: 'post_id', as: 'comments' });
    FeedComment_1.default.belongsTo(FeedPost_1.default, { foreignKey: 'post_id', as: 'post' });
    FeedComment_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'author' });
    FeedPost_1.default.hasMany(FeedMedia_1.default, { foreignKey: 'post_id', as: 'media' });
    FeedMedia_1.default.belongsTo(FeedPost_1.default, { foreignKey: 'post_id', as: 'post' });
    FeedPost_1.default.hasMany(PostTag_1.default, { foreignKey: 'post_id', as: 'postTags' });
    PostTag_1.default.belongsTo(FeedPost_1.default, { foreignKey: 'post_id', as: 'post' });
    PostTag_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'taggedUser' });
    User_1.default.hasMany(PostTag_1.default, { foreignKey: 'user_id', as: 'postTags' });
    // ── Task associations ──
    Task_1.default.belongsTo(User_1.default, { foreignKey: 'created_by', as: 'creator' });
    Task_1.default.belongsTo(User_1.default, { foreignKey: 'completed_by', as: 'completer' });
    User_1.default.hasMany(Task_1.default, { foreignKey: 'created_by', as: 'createdTasks' });
    Task_1.default.belongsToMany(User_1.default, { through: TaskAssignee_1.default, foreignKey: 'task_id', otherKey: 'user_id', as: 'assignees' });
    User_1.default.belongsToMany(Task_1.default, { through: TaskAssignee_1.default, foreignKey: 'user_id', otherKey: 'task_id', as: 'assignedTasks' });
    // ── Expense associations ──
    Expense_1.default.belongsTo(User_1.default, { foreignKey: 'paid_by', as: 'payer' });
    Expense_1.default.hasMany(ExpenseParticipant_1.default, { foreignKey: 'expense_id', as: 'participants' });
    ExpenseParticipant_1.default.belongsTo(Expense_1.default, { foreignKey: 'expense_id', as: 'expense' });
    ExpenseParticipant_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    Settlement_1.default.belongsTo(User_1.default, { foreignKey: 'from_user_id', as: 'fromUser' });
    Settlement_1.default.belongsTo(User_1.default, { foreignKey: 'to_user_id', as: 'toUser' });
    // ── Conversation associations ──
    Conversation_1.default.belongsTo(Household_1.default, { foreignKey: 'household_id', as: 'household' });
    Household_1.default.hasMany(Conversation_1.default, { foreignKey: 'household_id', as: 'conversations' });
    Conversation_1.default.belongsTo(User_1.default, { foreignKey: 'created_by', as: 'creator' });
    Conversation_1.default.belongsToMany(User_1.default, { through: ConversationParticipant_1.default, foreignKey: 'conversation_id', otherKey: 'user_id', as: 'participants' });
    User_1.default.belongsToMany(Conversation_1.default, { through: ConversationParticipant_1.default, foreignKey: 'user_id', otherKey: 'conversation_id', as: 'conversations' });
    Conversation_1.default.hasMany(ChatMessage_1.default, { foreignKey: 'conversation_id', as: 'messages' });
    ChatMessage_1.default.belongsTo(Conversation_1.default, { foreignKey: 'conversation_id', as: 'conversation', constraints: false });
    // ── Chat associations ──
    ChatMessage_1.default.belongsTo(User_1.default, { foreignKey: 'sender_id', as: 'sender' });
    User_1.default.hasMany(ChatMessage_1.default, { foreignKey: 'sender_id', as: 'sentMessages' });
    ChatMessage_1.default.hasMany(ChatReaction_1.default, { foreignKey: 'message_id', as: 'reactions' });
    ChatReaction_1.default.belongsTo(ChatMessage_1.default, { foreignKey: 'message_id', as: 'message' });
    ChatReaction_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    // Self-referencing reply
    ChatMessage_1.default.belongsTo(ChatMessage_1.default, { foreignKey: 'reply_to_id', as: 'replyTo' });
    ChatMessage_1.default.hasMany(ChatMessage_1.default, { foreignKey: 'reply_to_id', as: 'replies' });
    // ── Calendar associations ──
    CalendarEvent_1.default.belongsTo(User_1.default, { foreignKey: 'created_by', as: 'creator' });
    // ── Check-In associations ──
    CheckIn_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    // ── Vault associations ──
    VaultDocument_1.default.belongsTo(User_1.default, { foreignKey: 'uploaded_by', as: 'uploader' });
    VaultKey_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    // Per-user wrapped AES keys for vault documents
    VaultDocument_1.default.hasMany(VaultDocumentKey_1.default, { foreignKey: 'document_id', as: 'documentKeys' });
    VaultDocumentKey_1.default.belongsTo(VaultDocument_1.default, { foreignKey: 'document_id', as: 'document' });
    VaultDocumentKey_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
    User_1.default.hasMany(VaultDocumentKey_1.default, { foreignKey: 'user_id', as: 'vaultDocumentKeys' });
    // HouseholdMember ↔ VaultKey (for key status lookups)
    HouseholdMember_1.default.hasOne(VaultKey_1.default, { foreignKey: 'user_id', sourceKey: 'userId', as: 'vaultKey' });
    // ── Grocery / Todo ──
    GroceryItem_1.default.belongsTo(User_1.default, { foreignKey: 'assigned_to', as: 'assignee' });
    GroceryItem_1.default.belongsTo(User_1.default, { foreignKey: 'bought_by', as: 'buyer' });
    TodoItem_1.default.belongsTo(User_1.default, { foreignKey: 'assigned_to', as: 'assignee' });
}
exports.default = models;
//# sourceMappingURL=index.js.map