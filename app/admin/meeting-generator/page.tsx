"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/providers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createSampleMeetings } from "@/lib/meeting-generator";
import toast from "react-hot-toast";

export default function MeetingGeneratorPage() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedMeetings, setGeneratedMeetings] = useState<any[]>([]);

  const handleGenerateMeetings = async (months: number = 3) => {
    if (role !== "admin") {
      toast.error("يجب أن تكون مديراً لإنشاء الاجتماعات");
      return;
    }

    setLoading(true);
    try {
      const meetings = await createSampleMeetings(months);
      setGeneratedMeetings(meetings);
      toast.success(`تم إنشاء ${meetings.length} اجتماع بنجاح!`);
    } catch (error) {
      console.error("Error generating meetings:", error);
      toast.error("خطأ في إنشاء الاجتماعات");
    } finally {
      setLoading(false);
    }
  };

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card glassy className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح لك</h2>
            <p className="text-gray-600 dark:text-gray-400">
              يجب أن تكون مديراً للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          مولد الاجتماعات
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إنشاء اجتماعات الجمعة الأسبوعية للأشهر القادمة
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Generate 1 Month */}
        <Card glassy>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">شهر واحد</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              إنشاء اجتماعات الجمعة للشهر القادم
            </p>
            <Button
              onClick={() => handleGenerateMeetings(1)}
              disabled={loading}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4 ml-2" />}
              إنشاء لشهر واحد
            </Button>
          </CardContent>
        </Card>

        {/* Generate 3 Months */}
        <Card glassy>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">3 أشهر</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              إنشاء اجتماعات الجمعة للـ 3 أشهر القادمة
            </p>
            <Button
              onClick={() => handleGenerateMeetings(3)}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4 ml-2" />}
              إنشاء لـ 3 أشهر
            </Button>
          </CardContent>
        </Card>

        {/* Generate 6 Months */}
        <Card glassy>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">6 أشهر</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              إنشاء اجتماعات الجمعة للـ 6 أشهر القادمة
            </p>
            <Button
              onClick={() => handleGenerateMeetings(6)}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4 ml-2" />}
              إنشاء لـ 6 أشهر
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Meetings List */}
      {generatedMeetings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card glassy>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                الاجتماعات المُنشأة ({generatedMeetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedMeetings.map((meeting, index) => (
                  <div
                    key={meeting.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {meeting.date.toLocaleDateString('ar-EG')} - {meeting.startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      تم الإنشاء
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      <Card glassy>
        <CardHeader>
          <CardTitle>كيفية الاستخدام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium">اختر الفترة الزمنية</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                اختر عدد الأشهر التي تريد إنشاء اجتماعات الجمعة لها
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium">انقر على زر الإنشاء</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                سيتم إنشاء جميع اجتماعات الجمعة للفترة المحددة تلقائياً
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium">انتقل إلى صفحة الحضور</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ستجد الاجتماعات الجديدة متاحة للتسجيل عليها
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
