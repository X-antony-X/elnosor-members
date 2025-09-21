import {
  type User,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
const facebookProvider = new FacebookAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    await createUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Facebook:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const createUserProfile = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        role: "member", // Default role
        createdAt,
        updatedAt: createdAt,
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  }
};

export const getUserRole = async (user: User): Promise<"admin" | "member"> => {
  try {
    // Force token refresh to get latest custom claims
    await user.getIdToken(true);

    const token = await user.getIdTokenResult();
    if (token.claims.role) {
      const tokenRole = token.claims.role === "admin" ? "admin" : "member";

      // If token says admin, verify admin profile exists
      if (tokenRole === "admin") {
        try {
          const adminRef = doc(db, "admins", user.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            return "admin";
          } else {
            // Token says admin but no admin profile - this might be a timing issue
            // Check users collection to confirm role
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().role === "admin") {
              // Role is admin in users collection but profile not created yet
              // Return admin and let the system create the profile
              return "admin";
            }
          }
        } catch (adminError) {
          console.warn("Error checking admin profile:", adminError);
          // If we can't read admin profile due to permissions, check users collection
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().role === "admin") {
            return "admin";
          }
        }
      }

      return tokenRole;
    }

    // If no role in custom claims, check Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const role = userData.role === "admin" ? "admin" : "member";

      // If role is admin, try to check admin profile
      if (role === "admin") {
        try {
          const adminRef = doc(db, "admins", user.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            return "admin";
          }
        } catch (adminError) {
          console.warn("Error checking admin profile:", adminError);
          // If we can't read admin profile, still return admin if users collection says so
        }
      }

      return role;
    }

    return "member";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "member";
  }
};

export const getUserProfile = async (user: User) => {
  try {
    const role = await getUserRole(user);

    if (role === "admin") {
      // Try to get admin profile first
      const adminRef = doc(db, "admins", user.uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        return { ...adminSnap.data(), id: adminSnap.id, role: "admin" };
      }

      // If no admin profile, try to get member profile and migrate
      const memberRef = doc(db, "members", user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        return { ...memberSnap.data(), id: memberSnap.id, role: "member" };
      }
    } else {
      // For members, get member profile
      const memberRef = doc(db, "members", user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        return { ...memberSnap.data(), id: memberSnap.id, role: "member" };
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};
