const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { applicationDefault } = require("firebase-admin/app");

const FIREBASE_STORAGE_BUCKET = "fir-recipes-94a10.appspot.com";

const apiFirebaseOptions = {
  ...functions.config().firebase,
  credential: applicationDefault(),
};

admin.initializeApp(apiFirebaseOptions);

const firestore = admin.firestore();
firestore.settings({ timestampsInSnapshots: true });
const storageBucket = admin.storage().bucket(FIREBASE_STORAGE_BUCKET);
const auth = admin.auth();

module.exports = {
  functions,
  auth,
  firestore,
  storageBucket,
  admin,
};
