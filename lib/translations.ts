export const translations = {
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    members: "الأعضاء",
    profile: "ملفي الشخصي", // Added profile translation
    attendance: "الحضور",
    notifications: "الإشعارات",
    posts: "المنشورات",
    dailyQuotes: "الآيات اليومية",
    analytics: "التقارير",
    settings: "الإعدادات",
    about: "حول التطبيق", // Added About page translations

    // Authentication
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    signInWithGoogle: "تسجيل الدخول بجوجل",
    signInWithFacebook: "تسجيل الدخول بفيسبوك",

    // Common
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    search: "بحث",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "تم بنجاح",

    // Members
    addMember: "إضافة عضو جديد",
    editMember: "تعديل العضو",
    fullName: "الاسم الكامل",
    phonePrimary: "رقم الهاتف الأساسي",
    phoneSecondary: "رقم الهاتف الثانوي",
    address: "العنوان",
    classStage: "المرحلة الدراسية",
    secondary: "ثانوي",
    university: "جامعي",
    universityYear: "السنة الجامعية",
    confessorName: "اسم أب الاعتراف",
    notes: "ملاحظات",

    // Attendance
    checkIn: "تسجيل الحضور",
    checkOut: "تسجيل الانصراف",
    scanQR: "مسح الكود",
    manualAttendance: "تسجيل يدوي",
    attendanceLog: "سجل الحضور",
    lateness: "التأخير",
    onTime: "في الوقت",
    late: "متأخر",

    // Time formats
    minutes: "دقيقة",
    hours: "ساعة",
    lateBy: "متأخر بـ",

    // Roles
    admin: "خادم",
    member: "مخدوم",

    // Notifications
    sendNotification: "إرسال إشعار",
    scheduleNotification: "جدولة إشعار",
    notificationTitle: "عنوان الإشعار",
    notificationMessage: "نص الإشعار",
    targetAudience: "الجمهور المستهدف",
    all: "الجميع",
    group: "مجموعة",
    individuals: "أفراد محددين",

    // Posts
    createPost: "إنشاء منشور",
    postContent: "محتوى المنشور",
    like: "إعجاب",
    comment: "تعليق",
    comments: "التعليقات",

    // Daily Quotes
    youthQuotes: "آيات الشباب",
    fathersQuotes: "أقوال الآباء",
    todaysQuote: "آية اليوم",

    // Analytics
    totalMembers: "إجمالي الأعضاء",
    todayAttendance: "حضور اليوم",
    averageAttendance: "متوسط الحضور",
    attendanceTrend: "اتجاه الحضور",
    exportReport: "تصدير التقرير",

    // Settings
    themeSettings: "إعدادات المظهر",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    primaryColor: "اللون الأساسي",
    meetingSchedule: "جدول الاجتماعات",
    dayOfWeek: "يوم الأسبوع",
    startTime: "وقت البداية",
    endTime: "وقت النهاية",

    // About
    appDescription: "تطبيق خدمة الشباب لإدارة الحضور والتفاعل",
    contactServants: "التواصل مع الخدام",
    groupChats: "مجموعات الدردشة",

    // Days of week
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",

    // PWA
    installApp: "تثبيت التطبيق",
    offlineMode: "وضع عدم الاتصال",
    syncData: "مزامنة البيانات",
  },
};

export const t = (key: string): string => {
  const keys = key.split(".")
  let value: any = translations.ar

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}
