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
exports.create = create;
exports.list = list;
exports.update = update;
exports.remove = remove;
exports.toggle = toggle;
exports.summary = summary;
const todoService = __importStar(require("./service"));
function getUserId(req) {
    return req.user.userId;
}
function getUserRole(req) {
    return req.user.role;
}
async function create(req, res, next) {
    try {
        const result = await todoService.createItem(getUserId(req), req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function list(req, res, next) {
    try {
        const filter = req.query.filter || 'all';
        const result = await todoService.getItems(getUserId(req), filter);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function update(req, res, next) {
    try {
        const result = await todoService.updateItem(req.params.id, getUserId(req), getUserRole(req), req.body);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function remove(req, res, next) {
    try {
        await todoService.deleteItem(req.params.id, getUserId(req), getUserRole(req));
        res.status(200).json({ success: true, data: { message: 'Deleted' } });
    }
    catch (e) {
        next(e);
    }
}
async function toggle(req, res, next) {
    try {
        const result = await todoService.toggleComplete(req.params.id, getUserId(req), getUserRole(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function summary(req, res, next) {
    try {
        const result = await todoService.getSummary(getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=controller.js.map