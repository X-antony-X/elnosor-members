import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

export function useDebugAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Auth state changed:", { user, loading });
    if (!loading) {
      if (user) {
        console.log("User is authenticated, redirecting to /dashboard");
        router.push("/dashboard");
      } else {
        console.log("User is not authenticated, staying on /auth");
      }
    }
  }, [user, loading, router]);
}
