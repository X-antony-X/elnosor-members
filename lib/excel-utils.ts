import * as XLSX from "xlsx";
import type { Member, AttendanceLog, Meeting } from "./types";

export interface ExcelMember {
  "الاسم الكامل": string;
  "الهاتف الأساسي": string;
  "الهاتف الثانوي"?: string;
  "تاريخ الميلاد"?: string;
  العنوان: string;
  "المرحلة الدراسية": "ثانوي" | "جامعي";
  "السنة الجامعية"?: number | string; // Allow string for template example
  "أب الاعتراف": string;
  ملاحظات?: string;
}

export interface ExcelAttendance {
  "اسم المخدوم": string;
  "تاريخ الاجتماع": string;
  "وقت الحضور": string;
  "وقت الانصراف"?: string;
  "طريقة التسجيل": "يدوي" | "QR" | "مسح";
  "التأخير (دقيقة)": number;
  ملاحظات?: string;
}

export class ExcelService {
  // Export members to Excel
  static exportMembers(members: Member[]): void {
    const excelData: ExcelMember[] = members.map((member) => ({
      "الاسم الكامل": member.fullName,
      "الهاتف الأساسي": member.phonePrimary,
      "الهاتف الثانوي": member.phoneSecondary || "",
      "تاريخ الميلاد": member.dateOfBirth
        ? new Date(member.dateOfBirth).toLocaleDateString("ar-EG")
        : "",
      العنوان: member.address.addressString,
      "المرحلة الدراسية":
        member.classStage === "university" ? "جامعي" : "ثانوي", // Explicitly cast to "جامعي" | "ثانوي"
      "السنة الجامعية": member.universityYear || "",
      "أب الاعتراف": member.confessorName,
      ملاحظات: member.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    const colWidths = [
      { wch: 20 }, // الاسم الكامل
      { wch: 15 }, // الهاتف الأساسي
      { wch: 15 }, // الهاتف الثانوي
      { wch: 15 }, // تاريخ الميلاد
      { wch: 30 }, // العنوان
      { wch: 15 }, // المرحلة الدراسية
      { wch: 12 }, // السنة الجامعية
      { wch: 20 }, // أب الاعتراف
      { wch: 25 }, // ملاحظات
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "الأعضاء");

    const fileName = `اعضاء_خدمة_الشباب_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Export attendance to Excel
  static exportAttendance(
    attendanceLogs: AttendanceLog[],
    members: Member[],
    meetings: Meeting[]
  ): void {
    const excelData: ExcelAttendance[] = attendanceLogs.map((log) => {
      const member = members.find((m) => m.id === log.memberId);
      const meeting = meetings.find((m) => m.id === log.meetingId);

      return {
        "اسم المخدوم": member?.fullName || "غير معروف",
        "تاريخ الاجتماع": meeting?.date.toLocaleDateString("ar-EG") || "",
        "وقت الحضور": log.checkInTimestamp.toLocaleTimeString("ar-EG"),
        "وقت الانصراف":
          log.checkOutTimestamp?.toLocaleTimeString("ar-EG") || "",
        "طريقة التسجيل":
          log.checkInMethod === "manual"
            ? "يدوي"
            : log.checkInMethod === "qr"
            ? "QR"
            : "مسح",
        "التأخير (دقيقة)": log.lateness || 0,
        ملاحظات: log.note || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    const colWidths = [
      { wch: 20 }, // اسم العضو
      { wch: 15 }, // تاريخ الاجتماع
      { wch: 12 }, // وقت الحضور
      { wch: 12 }, // وقت الانصراف
      { wch: 15 }, // طريقة التسجيل
      { wch: 15 }, // التأخير
      { wch: 25 }, // ملاحظات
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "سجل الحضور");

    const fileName = `سجل_الحضور_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Import members from Excel
  static async importMembers(
    file: File
  ): Promise<{ members: Partial<Member>[]; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: ExcelMember[] = XLSX.utils.sheet_to_json(worksheet);

          const members: Partial<Member>[] = [];
          const errors: string[] = [];

          jsonData.forEach((row, index) => {
            const rowNumber = index + 2; // Excel row number (1-based + header)

            // Validate required fields
            if (!row["الاسم الكامل"]) {
              errors.push(`الصف ${rowNumber}: الاسم الكامل مطلوب`);
              return;
            }

            if (!row["الهاتف الأساسي"]) {
              errors.push(`الصف ${rowNumber}: الهاتف الأساسي مطلوب`);
              return;
            }

            if (!row["العنوان"]) {
              errors.push(`الصف ${rowNumber}: العنوان مطلوب`);
              return;
            }

            if (!row["أب الاعتراف"]) {
              errors.push(`الصف ${rowNumber}: أب الاعتراف مطلوب`);
              return;
            }

            // Validate class stage
            const classStage =
              row["المرحلة الدراسية"] === "جامعي" ? "university" : "graduation";

            // Validate university year if university student
            let universityYear: number | undefined;
            if (classStage === "university" && row["السنة الجامعية"]) {
              universityYear = Number(row["السنة الجامعية"]);
              if (
                isNaN(universityYear) ||
                universityYear < 1 ||
                universityYear > 6
              ) {
                errors.push(
                  `الصف ${rowNumber}: السنة الجامعية يجب أن تكون بين 1 و 6`
                );
                return;
              }
            }

            // Validate phone number format
            const phoneRegex = /^01[0-9]{9}$/;
            if (!phoneRegex.test(row["الهاتف الأساسي"])) {
              errors.push(`الصف ${rowNumber}: تنسيق الهاتف الأساسي غير صحيح`);
              return;
            }

            if (
              row["الهاتف الثانوي"] &&
              !phoneRegex.test(row["الهاتف الثانوي"])
            ) {
              errors.push(`الصف ${rowNumber}: تنسيق الهاتف الثانوي غير صحيح`);
              return;
            }

            const member: Partial<Member> = {
              fullName: row["الاسم الكامل"].trim(),
              phonePrimary: row["الهاتف الأساسي"].trim(),
              phoneSecondary: row["الهاتف الثانوي"]?.trim() || undefined,
              dateOfBirth: row["تاريخ الميلاد"]
                ? new Date(row["تاريخ الميلاد"])
                : undefined,
              address: {
                addressString: row["العنوان"].trim(),
              },
              classStage,
              universityYear,
              confessorName: row["أب الاعتراف"].trim(),
              notes: row["ملاحظات"]?.trim() || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            members.push(member);
          });

          resolve({ members, errors });
        } catch (error) {
          reject(
            new Error("خطأ في قراءة الملف. تأكد من أن الملف بتنسيق Excel صحيح.")
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("خطأ في قراءة الملف"));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Generate Excel template for members
  static downloadMembersTemplate(): void {
    const templateData: ExcelMember[] = [
      {
        "الاسم الكامل": "مثال: استفانوس كبريانوس",
        "الهاتف الأساسي": "01234567890",
        "الهاتف الثانوي": "01123456789",
        "تاريخ الميلاد": "1990-01-01",
        العنوان: "مثال: شارع الجمهورية، القاهرة",
        "المرحلة الدراسية": "جامعي",
        "السنة الجامعية": 2,
        "أب الاعتراف": "مثال: أبونا يوسف",
        ملاحظات: "ملاحظات اختيارية",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    const colWidths = [
      { wch: 20 }, // الاسم الكامل
      { wch: 15 }, // الهاتف الأساسي
      { wch: 15 }, // الهاتف الثانوي
      { wch: 15 }, // تاريخ الميلاد
      { wch: 30 }, // العنوان
      { wch: 15 }, // المرحلة الدراسية
      { wch: 12 }, // السنة الجامعية
      { wch: 20 }, // أب الاعتراف
      { wch: 25 }, // ملاحظات
    ];
    worksheet["!cols"] = colWidths;

    // Add data validation for class stage
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 5 }); // Column F (المرحلة الدراسية) - shifted by 1 due to new column
      if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: "s", v: "" };
      worksheet[cellAddress].s = {
        validation: {
          type: "list",
          formula1: '"ثانوي,جامعي"',
        },
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "قالب الأعضاء");

    const fileName = "قالب_استيراد_الاعضاء.xlsx";
    XLSX.writeFile(workbook, fileName);
  }

  // Generate comprehensive attendance report
  static exportAttendanceReport(
    attendanceLogs: AttendanceLog[],
    members: Member[],
    meetings: Meeting[],
    startDate?: Date,
    endDate?: Date
  ): void {
    // Filter by date range if provided
    let filteredLogs = attendanceLogs;
    if (startDate || endDate) {
      filteredLogs = attendanceLogs.filter((log) => {
        const logDate = log.checkInTimestamp;
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
      });
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Detailed attendance
    const detailedData: ExcelAttendance[] = filteredLogs.map((log) => {
      const member = members.find((m) => m.id === log.memberId);
      const meeting = meetings.find((m) => m.id === log.meetingId);

      return {
        "اسم المخدوم": member?.fullName || "غير معروف",
        "تاريخ الاجتماع": meeting?.date.toLocaleDateString("ar-EG") || "",
        "وقت الحضور": log.checkInTimestamp.toLocaleTimeString("ar-EG"),
        "وقت الانصراف":
          log.checkOutTimestamp?.toLocaleTimeString("ar-EG") || "",
        "طريقة التسجيل":
          log.checkInMethod === "manual"
            ? "يدوي"
            : log.checkInMethod === "qr"
            ? "QR"
            : "مسح",
        "التأخير (دقيقة)": log.lateness || 0,
        ملاحظات: log.note || "",
      };
    });

    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(
      workbook,
      detailedSheet,
      "سجل الحضور التفصيلي"
    );

    // Sheet 2: Attendance summary by member
    const memberStats = members.map((member) => {
      const memberLogs = filteredLogs.filter(
        (log) => log.memberId === member.id
      );
      const totalAttendance = memberLogs.length;
      const totalLateness = memberLogs.reduce(
        (sum, log) => sum + (log.lateness || 0),
        0
      );
      const avgLateness =
        totalAttendance > 0 ? Math.round(totalLateness / totalAttendance) : 0;

      return {
        "اسم العضو": member.fullName,
        "إجمالي الحضور": totalAttendance,
        "متوسط التأخير (دقيقة)": avgLateness,
        "المرحلة الدراسية":
          member.classStage === "university" ? "جامعي" : "ثانوي",
        "أب الاعتراف": member.confessorName,
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(memberStats);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "ملخص الحضور");

    // Sheet 3: Attendance by meeting
    const meetingStats = meetings.map((meeting) => {
      const meetingLogs = filteredLogs.filter(
        (log) => log.meetingId === meeting.id
      );
      const totalAttendees = meetingLogs.length;
      const onTimeAttendees = meetingLogs.filter(
        (log) => (log.lateness || 0) === 0
      ).length;
      const lateAttendees = totalAttendees - onTimeAttendees;

      return {
        "تاريخ الاجتماع": meeting.date.toLocaleDateString("ar-EG"),
        "عنوان الاجتماع": meeting.title,
        "إجمالي الحضور": totalAttendees,
        "الحضور في الوقت": onTimeAttendees,
        "الحضور المتأخر": lateAttendees,
        "نسبة الحضور في الوقت":
          totalAttendees > 0
            ? Math.round((onTimeAttendees / totalAttendees) * 100) + "%"
            : "0%",
      };
    });

    const meetingSheet = XLSX.utils.json_to_sheet(meetingStats);
    XLSX.utils.book_append_sheet(workbook, meetingSheet, "إحصائيات الاجتماعات");

    const fileName = `تقرير_الحضور_الشامل_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
