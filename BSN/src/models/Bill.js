const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bill = sequelize.define('Bill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  billNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sponsor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
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
    defaultValue: 'draft'
  },
  stageNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stageUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'bills',
  timestamps: true
});

module.exports = Bill;
