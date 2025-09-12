"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WebAuthnService, type WebAuthnCredential } from "@/lib/webauthn"
import { useAuth } from "@/app/providers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Fingerprint, Shield, Smartphone, Key, Plus, Trash2, Edit, CheckCircle, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

export function WebAuthnSetup() {
  const { user } = useAuth()
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [webauthnSupported, setWebauthnSupported] = useState(false)
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false)
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<{ id: string; nickname: string } | null>(null)

  useEffect(() => {
    const checkSupport = async () => {
      const supported = WebAuthnService.isSupported()
      setWebauthnSupported(supported)

      if (supported) {
        const platformAuth = await WebAuthnService.isPlatformAuthenticatorAvailable()
        setPlatformAuthAvailable(platformAuth)
      }

      setLoading(false)
    }

    checkSupport()
  }, [])

  useEffect(() => {
    if (user && webauthnSupported) {
      loadCredentials()
    }
  }, [user, webauthnSupported])

  const loadCredentials = async () => {
    if (!user) return

    try {
      const userCredentials = await WebAuthnService.getUserCredentials(user.uid)
      setCredentials(userCredentials)
    } catch (error) {
      console.error("Error loading credentials:", error)
      toast.error("خطأ في تحميل بيانات المصادقة")
    }
  }

  const handleRegisterCredential = async () => {
    if (!user) return

    setRegistering(true)
    try {
      await WebAuthnService.registerCredential(
        user.uid,
        user.email || user.uid,
        user.displayName || "مستخدم",
        credentials.map((c) => c.credentialID),
      )

      toast.success("تم تسجيل طريقة المصادقة الجديدة بنجاح")
      await loadCredentials()
      setSetupDialogOpen(false)
    } catch (error: any) {
      console.error("Registration error:", error)

      if (error.name === "NotAllowedError") {
        toast.error("تم إلغاء العملية أو انتهت مهلة الانتظار")
      } else if (error.name === "SecurityError") {
        toast.error("خطأ أمني في التسجيل")
      } else if (error.name === "InvalidStateError") {
        toast.error("هذه الطريقة مسجلة بالفعل")
      } else {
        toast.error("خطأ في تسجيل طريقة المصادقة")
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleDeleteCredential = async (credentialId: string) => {
    if (!user) return

    try {
      const success = await WebAuthnService.deleteCredential(user.uid, credentialId)
      if (success) {
        toast.success("تم حذف طريقة المصادقة")
        await loadCredentials()
      } else {
        toast.error("خطأ في حذف طريقة المصادقة")
      }
    } catch (error) {
      toast.error("خطأ في حذف طريقة المصادقة")
    }
  }

  const handleUpdateNickname = async () => {
    if (!user || !editingCredential) return

    try {
      const success = await WebAuthnService.updateCredentialNickname(
        user.uid,
        editingCredential.id,
        editingCredential.nickname,
      )

      if (success) {
        toast.success("تم تحديث الاسم")
        await loadCredentials()
        setEditingCredential(null)
      } else {
        toast.error("خطأ في تحديث الاسم")
      }
    } catch (error) {
      toast.error("خطأ في تحديث الاسم")
    }
  }

  const getCredentialIcon = (credential: WebAuthnCredential) => {
    if (credential.deviceType === "multiDevice") {
      return <Key className="w-5 h-5 text-blue-600" />
    } else if (credential.transports?.includes("internal")) {
      return <Fingerprint className="w-5 h-5 text-green-600" />
    } else {
      return <Smartphone className="w-5 h-5 text-purple-600" />
    }
  }

  const getCredentialTypeText = (credential: WebAuthnCredential) => {
    if (credential.deviceType === "multiDevice") {
      return "مفتاح أمان"
    } else if (credential.transports?.includes("internal")) {
      return "بصمة الجهاز"
    } else {
      return "مصادقة خارجية"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!webauthnSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            المصادقة البيومترية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              المتصفح الحالي لا يدعم المصادقة البيومترية. يرجى استخدام متصفح حديث مثل Chrome أو Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            المصادقة البيومترية
            <Badge variant="secondary" className="text-xs">
              محسن
            </Badge>
          </CardTitle>

          <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة طريقة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طريقة مصادقة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Fingerprint className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-medium">بصمة الإصبع أو Face ID</h4>
                      <p className="text-sm text-gray-600">استخدم بصمة الإصبع أو التعرف على الوجه</p>
                    </div>
                    {platformAuthAvailable && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Key className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium">مفتاح الأمان</h4>
                      <p className="text-sm text-gray-600">مفتاح USB أو NFC للأمان</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    ستحتاج للتحقق من هويتك باستخدام الطريقة المختارة. لن يتم حفظ بياناتك البيومترية على الخادم.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleRegisterCredential} disabled={registering}>
                    {registering ? (
                      <>
                        <LoadingSpinner size="sm" className="ml-2" />
                        جاري التسجيل...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 ml-2" />
                        تسجيل
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {credentials.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Fingerprint className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">لم يتم إعداد المصادقة البيومترية</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                أضف بصمة الإصبع أو مفتاح أمان لحماية إضافية
              </p>
            </div>
            <Button onClick={() => setSetupDialogOpen(true)} className="mt-4">
              <Plus className="w-4 h-4 ml-2" />
              إعداد المصادقة البيومترية
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential, index) => (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getCredentialIcon(credential)}
                  <div>
                    <h4 className="font-medium">{credential.nickname || getCredentialTypeText(credential)}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{getCredentialTypeText(credential)}</span>
                      {credential.backedUp && (
                        <Badge variant="outline" className="text-xs">
                          محفوظ احتياطياً
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      آخر استخدام: {credential.lastUsed.toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCredential({ id: credential.id, nickname: credential.nickname || "" })}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCredential(credential.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {platformAuthAvailable && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>بصمة الإصبع أو Face ID متاح على هذا الجهاز</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {editingCredential && (
        <Dialog open={!!editingCredential} onOpenChange={() => setEditingCredential(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل اسم طريقة المصادقة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname">الاسم المخصص</Label>
                <Input
                  id="nickname"
                  value={editingCredential.nickname}
                  onChange={(e) => setEditingCredential({ ...editingCredential, nickname: e.target.value })}
                  placeholder="مثال: iPhone الشخصي، مفتاح العمل"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingCredential(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdateNickname}>حفظ</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
