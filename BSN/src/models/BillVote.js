const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BillVote = sequelize.define('BillVote', {
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
  },
  vote: {
    type: DataTypes.ENUM('yes','no','abstain'),
    allowNull: false
  }
}, {
  tableName: 'bill_votes',
  timestamps: true,
  indexes: [ { unique: true, fields: ['userId','billId'] } ]
});

module.exports = BillVote;
