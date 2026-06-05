/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

let firebaseEnabled = false;
let db: any = null;
let auth: any = null;

const provider = new GoogleAuthProvider();

// Check if credentials are generic stubs or real credentials
if (
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "STUB_API_KEY" &&
  firebaseConfig.projectId !== "stub-app"
) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL requirement: getFirestore with custom ID */
    auth = getAuth(app);
    firebaseEnabled = true;

    // Validate connection to Firestore as required by scale rules
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.warn("Client is offline; operating in offline mode.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.warn("Firebase initialization failed; falling back to offline LocalStorage.", err);
  }
} else {
  console.info("No production Firebase project configured; using robust high-performance LocalStorage for school progress.");
}

export { db, auth, firebaseEnabled, provider, signInWithPopup, signOut };

// Specific error diagnostics interface specified by the Firebase skill guidelines
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || "offline_student",
      email: auth?.currentUser?.email || "offline_student@school-rep.ai",
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error details triggered: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
