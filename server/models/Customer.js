const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Customer extends Model {}

Customer.init({
  
  id: {
    type: DataTypes.UUID, 
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  
  companyName: { type: DataTypes.STRING(200), allowNull: false },
  contactNumber: { type: DataTypes.STRING(50) },
  email: { type: DataTypes.STRING(180) },
  vatNo: { type: DataTypes.STRING(80) },
  address: { type: DataTypes.TEXT },

industry: { type: DataTypes.STRING(120), allowNull: true },      
website: { type: DataTypes.STRING(200), allowNull: true },         
category: {                                                        
  type: DataTypes.ENUM('Enterprise','SMB','Individual','SME'),
  allowNull: true
},contactedBy: {
   
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },

    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sizeOfCompany: {
      type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on-hold', 'closed'),
      allowNull: false,
      defaultValue: 'active',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
     social: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [], 
    },
  salesmanId: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'customers', timestamps: true });

module.exports = Customer;
