const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// In-memory challenge store (replace with Redis in production)
const challengeStore = new Map();

const RP_NAME = () => process.env.WEBAUTHN_RP_NAME || 'Office Checkin';
const RP_ID = () => process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = () => process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

function storeChallenge(key, challenge, ttlMs = 5 * 60 * 1000) {
  challengeStore.set(key, { challenge, expiresAt: Date.now() + ttlMs });
  setTimeout(() => challengeStore.delete(key), ttlMs);
}

function getChallenge(key) {
  const entry = challengeStore.get(key);
  if (!entry) throw new Error('Challenge not found or expired');
  if (Date.now() > entry.expiresAt) {
    challengeStore.delete(key);
    throw new Error('Challenge expired');
  }
  challengeStore.delete(key);
  return entry.challenge;
}

exports.getRegistrationOptions = async (employee) => {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME(),
    rpID: RP_ID(),
    userID: Buffer.from(String(employee._id)),
    userName: employee.employeeCode,
    userDisplayName: employee.fullName,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
      authenticatorAttachment: 'platform',
    },
    excludeCredentials: employee.credentialId
      ? [{ id: employee.credentialId, type: 'public-key' }]
      : [],
  });

  storeChallenge(`reg:${employee._id}`, options.challenge);
  return options;
};

exports.verifyRegistration = async (employee, body) => {
  const expectedChallenge = getChallenge(`reg:${employee._id}`);

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: ORIGIN(),
    expectedRPID: RP_ID(),
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Registration verification failed');
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  return {
    credentialId: Buffer.from(credential.id).toString('base64url'),
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    deviceInfo: `${credentialDeviceType}${credentialBackedUp ? ':backed-up' : ''}`,
  };
};

exports.getAuthenticationOptions = async (employee) => {
  if (!employee.credentialId) {
    throw new Error('Employee has no registered passkey');
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID(),
    userVerification: 'required',
    allowCredentials: [
      { id: employee.credentialId, type: 'public-key' },
    ],
  });

  storeChallenge(`auth:${employee._id}`, options.challenge);
  return options;
};

exports.verifyAuthentication = async (employee, body) => {
  const expectedChallenge = getChallenge(`auth:${employee._id}`);

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: ORIGIN(),
    expectedRPID: RP_ID(),
    requireUserVerification: true,
    credential: {
      id: employee.credentialId,
      publicKey: Buffer.from(employee.publicKey, 'base64url'),
      counter: employee.counter,
    },
  });

  if (!verification.verified) {
    throw new Error('Authentication verification failed');
  }

  return verification.authenticationInfo.newCounter;
};
