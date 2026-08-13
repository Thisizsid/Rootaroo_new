import { Request, Response, NextFunction } from 'express';
export declare const vaultUpload: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare function uploadDocumentCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listDocumentsCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getDocumentByIdCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateDocumentCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteDocumentCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function hardDeleteDocumentCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getStorageUsageCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function storeUserKeyCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getUserKeyCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHouseholdPublicKeysCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function performKeyCeremonyCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function rotateVaultKeyCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getDocumentKeyCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHouseholdKeyStatusCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function revokeAndRekeyCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map