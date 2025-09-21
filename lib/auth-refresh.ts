import type { User } from "firebase/auth";
import { getUserRole } from "./auth";

export const refreshUserRole = async (
  user: User
): Promise<"admin" | "member"> => {
  try {
    // Force token refresh to get latest custom claims
    await user.getIdToken(true);
    return await getUserRole(user);
  } catch (error) {
    console.error("Error refreshing user role:", error);
    return "member";
  }
};
