import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const usersFile = process.env.USER_STORE_FILE || path.join(dataDir, 'users.json');
const consentsFile = process.env.CONSENT_STORE_FILE || path.join(dataDir, 'consents.json');

function ensureFile(filePath, fallback) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureFile(filePath, Array.isArray(value) ? [] : {});
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

const users = readJson(usersFile, {});
const consents = readJson(consentsFile, []);

export function getUserByEmail(email) {
  return users[email] || null;
}

export function saveUser(email, user) {
  users[email] = user;
  writeJson(usersFile, users);
  return users[email];
}

export function findConsentById(credentialId) {
  return consents.find((consent) => consent.credential_id === credentialId) || null;
}

export function saveConsent(consent) {
  const index = consents.findIndex((item) => item.credential_id === consent.credential_id);
  if (index >= 0) {
    consents[index] = consent;
  } else {
    consents.push(consent);
  }
  writeJson(consentsFile, consents);
  return consent;
}

export function updateConsent(credentialId, updater) {
  const existing = findConsentById(credentialId);
  if (!existing) {
    return null;
  }
  const updated = updater(existing);
  return saveConsent(updated);
}

export function listConsentsForUser(userHash) {
  return consents
    .filter((consent) => !userHash || consent.user_hash === userHash)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
