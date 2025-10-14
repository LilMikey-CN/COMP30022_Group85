const admin = require('firebase-admin');

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

const hasCredentials = missingVars.length === 0;

if (!admin.apps.length && hasCredentials) {
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey.includes('\\n')
    ? rawPrivateKey.replace(/\\n/g, '\n')
    : rawPrivateKey;

  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
} else if (!admin.apps.length && !hasCredentials) {
  const formattedMissing = missingVars.join(', ');
  console.warn(
    `[firebase] Firebase Admin not initialized. Missing environment variables: ${formattedMissing}`
  );
}

const createUnavailableProxy = (serviceName) => new Proxy(
  {},
  {
    get() {
      throw new Error(
        `Firebase ${serviceName} is unavailable. Ensure service account environment variables are configured.`
      );
    }
  }
);

const db = admin.apps.length ? admin.firestore() : createUnavailableProxy('Firestore');
const auth = admin.apps.length ? admin.auth() : createUnavailableProxy('Auth');

module.exports = {
  admin,
  db,
  auth,
  isInitialized: admin.apps.length > 0
};
