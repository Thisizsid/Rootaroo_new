import { Model, CreationOptional } from 'sequelize';
declare class VaultDocument extends Model {
    id: CreationOptional<string>;
    householdId: string;
    uploadedBy: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    encryptedKey: string;
    iv: string;
    cloudinaryPublicId: string;
    cloudinarySecureUrl: string;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default VaultDocument;
//# sourceMappingURL=VaultDocument.d.ts.map