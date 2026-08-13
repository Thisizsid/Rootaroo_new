"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
exports.updateProfile = updateProfile;
exports.googleAuth = googleAuth;
exports.sendVerification = sendVerification;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.scheduleDeletion = scheduleDeletion;
exports.cancelDeletion = cancelDeletion;
exports.confirmDeletion = confirmDeletion;
exports.uploadAvatarCtrl = uploadAvatarCtrl;
exports.cancelPendingRegistration = cancelPendingRegistration;
exports.registerPhone = registerPhone;
exports.sendPhoneOtp = sendPhoneOtp;
exports.verifyPhoneOtp = verifyPhoneOtp;
const authService = __importStar(require("./service"));
const cloudinary_1 = require("../../shared/utils/cloudinary");
async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function refresh(req, res, next) {
    try {
        const result = await authService.refresh(req.body.refreshToken);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function logout(req, res, next) {
    try {
        await authService.logout(req.body.refreshToken);
        res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
    }
    catch (e) {
        next(e);
    }
}
async function me(req, res, next) {
    try {
        const auth = req;
        const user = await authService.getProfile(auth.user.userId);
        res.status(200).json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
}
async function updateProfile(req, res, next) {
    try {
        const auth = req;
        const user = await authService.updateProfile(auth.user.userId, req.body);
        res.status(200).json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
}
async function googleAuth(req, res, next) {
    try {
        const result = await authService.googleAuth(req.body);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function sendVerification(req, res, next) {
    try {
        const auth = req;
        await authService.sendVerification(auth.user.userId);
        res.status(200).json({ success: true, data: { message: 'Verification code sent' } });
    }
    catch (e) {
        next(e);
    }
}
async function verifyEmail(req, res, next) {
    try {
        const auth = req;
        await authService.verifyEmail(auth.user.userId, req.body);
        res.status(200).json({ success: true, data: { message: 'Email verified successfully' } });
    }
    catch (e) {
        next(e);
    }
}
async function forgotPassword(req, res, next) {
    try {
        await authService.forgotPassword(req.body);
        res.status(200).json({ success: true, data: { message: 'If an account exists, a reset code has been sent' } });
    }
    catch (e) {
        next(e);
    }
}
async function resetPassword(req, res, next) {
    try {
        await authService.resetPassword(req.body);
        res.status(200).json({ success: true, data: { message: 'Password reset successfully' } });
    }
    catch (e) {
        next(e);
    }
}
async function scheduleDeletion(req, res, next) {
    try {
        const auth = req;
        await authService.scheduleDeletion(auth.user.userId, req.body);
        res.status(200).json({ success: true, data: { message: 'Account scheduled for deletion in 30 days' } });
    }
    catch (e) {
        next(e);
    }
}
async function cancelDeletion(req, res, next) {
    try {
        const auth = req;
        await authService.cancelDeletion(auth.user.userId);
        res.status(200).json({ success: true, data: { message: 'Deletion cancelled' } });
    }
    catch (e) {
        next(e);
    }
}
async function confirmDeletion(req, res, next) {
    try {
        const auth = req;
        await authService.confirmDeletion(auth.user.userId, req.body);
        res.status(200).json({ success: true, data: { message: 'Account deleted' } });
    }
    catch (e) {
        next(e);
    }
}
async function uploadAvatarCtrl(req, res, next) {
    try {
        const auth = req;
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, error: 'No file uploaded.' });
            return;
        }
        const result = await (0, cloudinary_1.uploadBuffer)(file.buffer, {
            folder: 'rootaru/avatars',
            resource_type: 'image',
        });
        const avatarUrl = result.secure_url;
        const user = await authService.updateProfile(auth.user.userId, { avatarUrl });
        res.status(200).json({ success: true, data: { avatarUrl, user } });
    }
    catch (e) {
        next(e);
    }
}
async function cancelPendingRegistration(req, res, next) {
    try {
        const auth = req;
        await authService.cancelPendingRegistration(auth.user.userId);
        res.status(200).json({ success: true, data: { message: 'Pending registration cancelled' } });
    }
    catch (e) {
        next(e);
    }
}
async function registerPhone(req, res, next) {
    try {
        const result = await authService.registerPhone(req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function sendPhoneOtp(req, res, next) {
    try {
        const auth = req;
        const code = await authService.sendPhoneOtp(req.body, auth.user?.userId);
        res.status(200).json({
            success: true,
            data: { message: 'OTP sent', ...(code ? { code } : {}) },
        });
    }
    catch (e) {
        next(e);
    }
}
async function verifyPhoneOtp(req, res, next) {
    try {
        const auth = req;
        const result = await authService.verifyPhoneOtp(req.body, auth.user?.userId);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=controller.js.map