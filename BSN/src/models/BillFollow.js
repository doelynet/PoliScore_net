const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BillFollow = sequelize.define('BillFollow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  billId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'bills', key: 'id' }
  }
}, {
  tableName: 'bill_follows',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'billId'] }
  ]
});

module.exports = BillFollow;
