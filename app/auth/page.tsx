"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInWithGoogle, signInWithFacebook } from "@/lib/auth"
import { WebAuthnService } from "@/lib/webauthn"
import { useAuth } from "@/app/providers"
import { t } from "@/lib/translations"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Fingerprint, Shield, Smartphone, Key, AlertCircle, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useDebugAuthRedirect } from "@/debug-auth-redirect"

export default function AuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [webauthnSupported, setWebauthnSupported] = useState(false)
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false)
  const [webauthnLoading, setWebauthnLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("social")
  const [isSigningIn, setIsSigningIn] = useState(false)

  useDebugAuthRedirect()

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (user && !loading && !isSigningIn) {
        try {
          const { doc, getDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")
          const docRef = doc(db, "members", user.uid)
          const memberDoc = await getDoc(docRef)

          if (memberDoc.exists()) {
            router.push("/profile")
          } else {
            router.push("/profile/complete")
          }
        } catch (error) {
          console.error("Error checking member profile:", error)
          router.push("/dashboard")
        }
      }
    }

    checkProfileAndRedirect()
  }, [user, loading, router, isSigningIn])

  useEffect(() => {
    // Check WebAuthn support
    const checkWebAuthnSupport = async () => {
      const supported = WebAuthnService.isSupported()
      setWebauthnSupported(supported)

      if (supported) {
        const platformAuth = await WebAuthnService.isPlatformAuthenticatorAvailable()
        setPlatformAuthAvailable(platformAuth)
      }
    }

    checkWebAuthnSupport()
  }, [])

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      console.log("Starting Google sign in")
      const user = await signInWithGoogle()
      console.log("User signed in:", user)
      if (user) {
        // Get ID token
        const idToken = await user.getIdToken()
        console.log("ID token obtained")

        // Call API to set session cookie
        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        })
        console.log("Session response:", sessionResponse.ok)

        if (!sessionResponse.ok) {
          console.error("Failed to set session")
          toast.error("فشل في إعداد الجلسة")
          return
        }

        // Check if user profile exists
        const profileResponse = await fetch(`/api/members/${user.uid}`, {
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        })
        console.log("Profile response:", profileResponse.status)
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          console.log("Profile data:", profileData)
          if (profileData && profileData.fullName) {
            // Profile exists, redirect to profile
            console.log("Redirecting to profile")
            window.location.href = "/profile"
          } else {
            // Profile incomplete, redirect to profile completion
            console.log("Redirecting to profile/complete")
            window.location.href = "/profile/complete"
          }
        } else {
          // If error fetching profile, redirect to profile completion
          console.log("Profile not found, redirecting to profile/complete")
          window.location.href = "/profile/complete"
        }
      }
    } catch (error) {
      console.error("Error in Google sign in:", error)
      toast.error("خطأ في تسجيل الدخول")
    }
  }

  const handleFacebookSignIn = async () => {
    setIsSigningIn(true)
    try {
      const user = await signInWithFacebook()
      if (user) {
        const idToken = await user.getIdToken()

        await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        })

        // Check if user profile exists
        const profileResponse = await fetch(`/api/members/${user.uid}`, {
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData && profileData.fullName) {
            // Profile exists, redirect to profile
            router.push("/profile")
          } else {
            // Profile incomplete, redirect to profile completion
            router.push("/profile/complete")
          }
        } else {
          // If error fetching profile, redirect to profile completion
          router.push("/profile/complete")
        }
      }
    } catch (error) {
      toast.error("خطأ في تسجيل الدخول")
    }
  }

  const handleWebAuthnSignIn = async () => {
    if (!webauthnSupported) {
      toast.error("المتصفح لا يدعم المصادقة البيومترية")
      return
    }

    setIsSigningIn(true)
    setWebauthnLoading(true)
    try {
      const result = await WebAuthnService.authenticate()

      if (result.success && result.user) {
        toast.success("تم تسجيل الدخول بنجاح باستخدام البصمة")
        // Handle successful WebAuthn authentication
        // You would typically create a Firebase custom token here

        // Check if user profile exists
        // For WebAuthn, we need to get the ID token from the authenticated user
        // Assuming result.user has uid and we can get ID token
        const currentUser = await import("firebase/auth").then(({ getAuth }) => getAuth().currentUser)
        if (currentUser) {
          const idToken = await currentUser.getIdToken()
          const profileResponse = await fetch(`/api/members/${result.user.uid}`, {
            headers: {
              "Authorization": `Bearer ${idToken}`,
            },
          })
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            if (profileData && profileData.fullName) {
              // Profile exists, redirect to profile
              router.push("/profile")
            } else {
              // Profile incomplete, redirect to profile completion
              router.push("/profile/complete")
            }
          } else {
            // If error fetching profile, redirect to profile completion
            router.push("/profile/complete")
          }
        } else {
          // If no current user, redirect to profile completion
          router.push("/profile/complete")
        }
      } else {
        toast.error("فشل في التحقق من الهوية")
      }
    } catch (error: any) {
      console.error("WebAuthn sign in error:", error)

      if (error.name === "NotAllowedError") {
        toast.error("تم إلغاء العملية أو انتهت مهلة الانتظار")
      } else if (error.name === "SecurityError") {
        toast.error("خطأ أمني في المصادقة")
      } else if (error.name === "AbortError") {
        toast.error("تم إلغاء العملية")
      } else {
        toast.error("خطأ في المصادقة البيومترية")
      }
    } finally {
      setWebauthnLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card glassy>
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              {/* <span className="text-2xl text-white">⛪</span> */}
              <img src="/images/logo.png" alt="Logo" className="w-30 h-30 rounded-full" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">شباب النسور</CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">إدارة الحضور والمشاركة</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="social" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  حسابات التواصل
                </TabsTrigger>
                <TabsTrigger value="biometric" className="flex items-center gap-2" disabled={!webauthnSupported}>
                  <Fingerprint className="w-4 h-4" />
                  البصمة
                  {webauthnSupported && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      جديد
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="social" className="space-y-4 mt-6">
                <Button onClick={handleGoogleSignIn} className="w-full bg-transparent" variant="outline">
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t("signInWithGoogle")}
                </Button>

                {/* Temporarily hidden due to issues */}
                {/* <Button onClick={handleFacebookSignIn} className="w-full bg-blue-600 hover:bg-blue-700">
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  {t("signInWithFacebook")}
                </Button> */}
              </TabsContent>

              <TabsContent value="biometric" className="space-y-4 mt-6">
                {!webauthnSupported ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      المتصفح الحالي لا يدعم المصادقة البيومترية. يرجى استخدام متصفح حديث مثل Chrome أو Safari.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">المصادقة البيومترية متاحة</span>
                      </div>

                      {platformAuthAvailable && (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">بصمة الإصبع أو Face ID متاح</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleWebAuthnSignIn}
                      disabled={webauthnLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {webauthnLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="ml-2" />
                          جاري التحقق...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-5 h-5 ml-2" />
                          تسجيل الدخول بالبصمة
                        </>
                      )}
                    </Button>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Key className="w-4 h-4" />
                        <span>يدعم أيضاً مفاتيح الأمان (Security Keys)</span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• بصمة الإصبع أو Face ID</p>
                        <p>• مفاتيح USB الأمنية</p>
                        <p>• مصادقة Windows Hello</p>
                      </div>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        المصادقة البيومترية توفر أماناً إضافياً وسهولة في الوصول. لن يتم حفظ بياناتك البيومترية على
                        الخادم.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {webauthnSupported && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <p className="text-xs text-gray-500">المصادقة البيومترية متاحة على هذا الجهاز</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
