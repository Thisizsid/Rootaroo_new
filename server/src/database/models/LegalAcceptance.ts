import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

export type LegalDocument = 'terms' | 'privacy';
export type LegalAcceptanceMethod = 'signup_checkbox' | 'signin_notice';

/**
 * Proof that someone accepted one legal document: which version, how, when (by their
 * phone and by the server), and from where. Rows are only ever added, never changed.
 */
class LegalAcceptance extends Model {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare document: LegalDocument;
  declare version: string;
  declare method: LegalAcceptanceMethod;
  /** When the box was ticked or the button tapped, as the phone reported it. */
  declare agreedAtClient: Date;
  /** When the server recorded it; the trusted time. */
  declare acceptedAt: Date;
  declare ip: string | null;
  declare appVersion: string | null;
  declare platform: string | null;
  declare createdAt: CreationOptional<Date>;
}

LegalAcceptance.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    document: { type: DataTypes.STRING(16), allowNull: false },
    version: { type: DataTypes.STRING(32), allowNull: false },
    method: { type: DataTypes.STRING(32), allowNull: false },
    agreedAtClient: { type: DataTypes.DATE, allowNull: false, field: 'agreed_at_client' },
    acceptedAt: { type: DataTypes.DATE, allowNull: false, field: 'accepted_at' },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    appVersion: { type: DataTypes.STRING(32), allowNull: true, field: 'app_version' },
    platform: { type: DataTypes.STRING(16), allowNull: true },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
  },
  {
    sequelize,
    tableName: 'legal_acceptances',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
    indexes: [{ name: 'idx_legal_acceptances_user', fields: ['user_id'] }],
  },
);

export default LegalAcceptance;
