// src/services/cognito.service.ts
import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const COG_POOL_ID = process.env.COG_POOL_ID!;
const COG_CLIENT_ID = process.env.COG_CLIENT_ID!;
const COG_CLIENT_SECRET = process.env.COG_CLIENT_SECRET || ""; // optional if your app client uses secret

const cip = new CognitoIdentityProviderClient({ region: REGION });

// --- Sign up ---
export async function cognitoSignUp(username: string, password: string, email: string) {
  const cmd = new SignUpCommand({
    ClientId: COG_CLIENT_ID,
    Username: username,
    Password: password,
    SecretHash: COG_CLIENT_SECRET ? secretHash(username) : undefined,
    UserAttributes: [{ Name: "email", Value: email }],
  });
  return cip.send(cmd);
}

// --- Confirm sign up ---
export async function cognitoConfirm(username: string, code: string) {
  const cmd = new ConfirmSignUpCommand({
    ClientId: COG_CLIENT_ID,
    Username: username,
    ConfirmationCode: code,
    SecretHash: COG_CLIENT_SECRET ? secretHash(username) : undefined,
  });
  return cip.send(cmd);
}

// --- Login (USER_PASSWORD_AUTH) ---
export async function cognitoLogin(username: string, password: string) {
  const cmd = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: COG_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      ...(COG_CLIENT_SECRET ? { SECRET_HASH: secretHash(username) } : {}),
    },
  });

  const out = await cip.send(cmd);
  const idToken = out.AuthenticationResult?.IdToken;
  if (!idToken) {
    throw new Error("Login failed: no IdToken returned from Cognito");
  }
  return idToken; // ← return the string your frontend expects
}

// ---- ID token verifier (cache the verifier instance) ----
const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: COG_POOL_ID,
  tokenUse: "id",
  clientId: COG_CLIENT_ID,
});

export async function verifyIdToken(token: string) {
  // Throws if invalid/expired; returns the decoded payload if valid
  return idTokenVerifier.verify(token);
}

// ---- Helper (only if your app client uses secret) ----
import crypto from "crypto";
function secretHash(username: string) {
  if (!COG_CLIENT_SECRET) return undefined;
  const hmac = crypto.createHmac("sha256", COG_CLIENT_SECRET);
  hmac.update(username + COG_CLIENT_ID);
  return hmac.digest("base64");
}