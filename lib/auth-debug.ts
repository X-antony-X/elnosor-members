import type { User } from "firebase/auth";
import { getUserRole } from "./auth";

export const debugUserRole = async (
  user: User
): Promise<"admin" | "member"> => {
  try {
    console.log("🔄 [DEBUG] Getting user role for:", user.uid, user.email);

    // Force token refresh to get latest custom claims
    await user.getIdToken(true);
    console.log("✅ [DEBUG] Token refreshed");

    const token = await user.getIdTokenResult();
    console.log("📋 [DEBUG] Token claims:", token.claims);

    if (token.claims.role) {
      console.log("🎯 [DEBUG] Role found in custom claims:", token.claims.role);
      return token.claims.role === "admin" ? "admin" : "member";
    }

    console.log("⚠️ [DEBUG] No role in custom claims, checking Firestore");

    // If no role in custom claims, check Firestore
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("./firebase");

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log("📄 [DEBUG] Firestore user data:", userData);
      const role = userData.role === "admin" ? "admin" : "member";

      // If role is admin, check if admin profile exists
      if (role === "admin") {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          console.log("✅ [DEBUG] Admin profile exists, returning admin");
          return "admin";
        } else {
          console.log(
            "⚠️ [DEBUG] Admin role in users but no admin profile - returning member"
          );
          // Admin role exists in users but no admin profile - return member
          return "member";
        }
      }

      console.log("📋 [DEBUG] Returning role from Firestore:", role);
      return role;
    }

    console.log("⚠️ [DEBUG] No user document found, returning member");
    return "member";
  } catch (error) {
    console.error("❌ [DEBUG] Error getting user role:", error);
    return "member";
  }
};
