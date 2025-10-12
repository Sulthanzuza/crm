const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class ShareGp extends Model {}

ShareGp.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quoteId: {
      type: DataTypes.UUID,
      allowNull: true, 
    },
    memberId: { 
      type: DataTypes.UUID,
      allowNull: false,
    },
    sharedMemberId: { 
      type: DataTypes.UUID,
      allowNull: false,
    },
    profitPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    profitAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'share_gp',
    timestamps: true, 
    indexes: [
      {
        unique: true,
        fields: ['leadId', 'sharedMemberId'], 
      },
    ],
  }
);

module.exports = ShareGp;
