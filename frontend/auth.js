import { auth, db } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const loginButton = document.querySelector("[data-login-button]");
const logoutButton = document.querySelector("[data-logout-button]");
const accountName = document.querySelector("[data-account-name]");
const authStatus = document.querySelector("[data-auth-status]");
const provider = new GoogleAuthProvider();

function setStatus(message) {
  if (authStatus) authStatus.textContent = message;
}

function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  button.textContent = label;
}

async function saveUserProfile(user) {
  const profileRef = doc(db, "users", user.uid);
  const profile = {
    uid: user.uid,
    displayName: user.displayName || "Heritage explorer",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLoginAt: serverTimestamp()
  };
  const existingProfile = await getDoc(profileRef);

  if (!existingProfile.exists()) profile.createdAt = serverTimestamp();
  await setDoc(profileRef, profile, { merge: true });
}

loginButton?.addEventListener("click", async () => {
  setBusy(loginButton, true, "Signing in…");
  setStatus("Opening secure Google sign-in.");

  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserProfile(result.user);
    setStatus(`Welcome, ${result.user.displayName || "explorer"}.`);
  } catch (error) {
    console.error("Firebase sign-in failed:", error);
    setStatus("We could not sign you in. Please try again.");
  } finally {
    setBusy(loginButton, false, "Log in");
  }
});

logoutButton?.addEventListener("click", async () => {
  setBusy(logoutButton, true, "Logging out…");

  try {
    await signOut(auth);
    setStatus("You have been logged out.");
  } catch (error) {
    console.error("Firebase logout failed:", error);
    setStatus("We could not log you out. Please try again.");
    setBusy(logoutButton, false, "Log out");
  }
});

onAuthStateChanged(auth, (user) => {
  const isSignedIn = Boolean(user);
  loginButton?.toggleAttribute("hidden", isSignedIn);
  logoutButton?.toggleAttribute("hidden", !isSignedIn);

  if (accountName) {
    accountName.hidden = !isSignedIn;
    accountName.textContent = isSignedIn
      ? `Hi, ${(user.displayName || "Explorer").split(" ")[0]}`
      : "";
  }

  if (isSignedIn) {
    setStatus(`Signed in as ${user.displayName || "Explorer"}.`);
  } else if (authStatus?.textContent === "Checking your account…") {
    setStatus("Log in to keep your SanskritiX profile connected.");
  }
});
