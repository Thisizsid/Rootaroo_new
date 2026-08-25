'use strict';

/**
 * Cloudinary -> S3 migration: `VaultDocument` used two columns
 * (`cloudinary_public_id` for delete, `cloudinary_secure_url` for display)
 * where S3 only needs one — the object key serves both purposes (delete-by-key
 * and sign-a-GET-url-by-key). Rename `cloudinary_public_id` to `s3_key` and
 * drop `cloudinary_secure_url`.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn('vault_documents', 'cloudinary_public_id', 's3_key');
    await queryInterface.removeColumn('vault_documents', 'cloudinary_secure_url');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('vault_documents', 's3_key', 'cloudinary_public_id');
    await queryInterface.addColumn('vault_documents', 'cloudinary_secure_url', {
      type: Sequelize.STRING(500),
      allowNull: false,
      defaultValue: '',
    });
  },
};
