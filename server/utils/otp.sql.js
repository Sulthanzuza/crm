
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const Otp = require('../models/Otp');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(code, salt);
}

async function verifyCode(code, codeHash) {
  return bcrypt.compare(code, codeHash);
}


async function createOrUpdateOtp(subjectType, subjectId, purpose) {

  await Otp.update(
    { isUsed: true },
    { where: { subjectType, subjectId, purpose, isUsed: false } }
  );

  const code = generateOTP();
  const codeHash = await hashCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); 
  const resendAfter = new Date(now.getTime() + 60 * 1000);    

  const rec = await Otp.create({
    subjectType,
    subjectId,
    purpose,
    codeHash,
    expiresAt,
    resendAfter,
    attempts: 0,
    maxAttempts: 5,
    isUsed: false,
  });

  return { code, record: rec };
}


async function canResend(subjectType, subjectId, purpose) {
  const current = await Otp.findOne({
    where: { subjectType, subjectId, purpose, isUsed: false },
    order: [['createdAt', 'DESC']],
  });
  if (!current) return true;
  const now = new Date();
  return now >= current.resendAfter;
}


async function verifyOtp(subjectType, subjectId, purpose, code) {
  const rec = await Otp.findOne({
    where: { subjectType, subjectId, purpose, isUsed: false },
    order: [['createdAt', 'DESC']],
  });
  if (!rec) return { ok: false, reason: 'INVALID' };

  const now = new Date();
  if (rec.expiresAt < now) {
    await rec.update({ isUsed: true });
    return { ok: false, reason: 'EXPIRED' };
  }
  if (rec.attempts >= rec.maxAttempts) {
    await rec.update({ isUsed: true });
    return { ok: false, reason: 'MAX_ATTEMPTS' };
  }

  const ok = await verifyCode(code, rec.codeHash);
  await rec.update({ attempts: rec.attempts + 1 });

  if (!ok) return { ok: false, reason: 'INVALID' };

  await rec.update({ isUsed: true });
  return { ok: true };
}

module.exports = { generateOTP, hashCode, verifyCode, createOrUpdateOtp, verifyOtp, canResend };
