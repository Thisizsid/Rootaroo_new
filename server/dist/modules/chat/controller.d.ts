import { Request, Response, NextFunction } from 'express';
export declare function sendMessageCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listMessagesCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMessageByIdCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateMessageCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteMessageCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function addReactionCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function removeReactionCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createConversationCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getUserConversationsCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function addParticipantCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function removeParticipantCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function typingCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteConversationCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map