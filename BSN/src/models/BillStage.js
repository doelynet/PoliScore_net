const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BillStage = sequelize.define('BillStage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  billId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'bills', key: 'id' },
    onDelete: 'CASCADE'
  },
  stage: {
    type: DataTypes.ENUM(
      'draft',
      'first_reading',
      'committee_stage',
      'second_reading',
      'third_reading',
      'presidential_assent',
      'enacted',
      'rejected'
    ),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL'
  },
  changedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bill_stages',
  timestamps: false,
  indexes: [
    { fields: ['billId'] },
    { fields: ['changedAt'] }
  ]
});

module.exports = BillStage;