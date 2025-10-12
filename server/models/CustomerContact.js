const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class CustomerContact extends Model {}

CustomerContact.init({

  id: {
    type: DataTypes.UUID, 
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: { type: DataTypes.STRING(160), allowNull: false },
  designation: { type: DataTypes.STRING(120) },
  mobile: { type: DataTypes.STRING(50) },
  fax: { type: DataTypes.STRING(50) },
  email: { type: DataTypes.STRING(180) },

department: { type: DataTypes.STRING(120), allowNull: true },      
social: { type: DataTypes.STRING(240), allowNull: true },          

  customerId: {
    type: DataTypes.UUID, 
    allowNull: false
  },
  
}, { sequelize, tableName: 'customer_contacts', timestamps: true });

module.exports = CustomerContact;
