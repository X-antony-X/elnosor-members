"use client";

import { useState, useEffect } from "react";
import { useMembers, useAttendance, usePosts } from "./use-firestore";

export interface AnalyticsData {
  // Attendance Analytics
  attendanceRate: number;
  averageLateness: number;
  attendanceTrend: { date: string; count: number; rate: number }[];
  memberAttendanceStats: {
    memberId: string;
    memberName: string;
    attendanceCount: number;
    attendanceRate: number;
  }[];

  // Member Analytics
  membersByStage: { stage: string; count: number }[];
  memberGrowth: { month: string; total: number; new: number }[];

  // Engagement Analytics
  postEngagement: {
    postId: string;
    likes: number;
    comments: number;
    engagement: number;
  }[];
  monthlyPosts: { month: string; count: number }[];

  // Meeting Analytics
  meetingStats: {
    meetingId: string;
    title: string;
    attendanceCount: number;
    attendanceRate: number;
  }[];
  weeklyAttendance: { week: string; count: number }[];

  // Performance Metrics
  totalMembers: number;
  activeMembers: number;
  averageAttendance: number;
  engagementRate: number;

  // Percentage Changes (calculated vs previous period)
  totalMembersChange: number;
  attendanceRateChange: number;
  activeMembersChange: number;
  engagementRateChange: number;
}

export const useAnalytics = (dateRange?: { start: Date; end: Date }) => {
  const { members } = useMembers();
  const { attendanceLogs, meetings } = useAttendance();
  const { posts } = usePosts();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      members.length === 0 &&
      attendanceLogs.length === 0 &&
      posts.length === 0
    ) {
      setLoading(false);
      // Return default analytics with zero values when no data is available
      setAnalytics({
        attendanceRate: 0,
        averageLateness: 0,
        attendanceTrend: [],
        memberAttendanceStats: [],
        membersByStage: [],
        memberGrowth: [],
        postEngagement: [],
        monthlyPosts: [],
        meetingStats: [],
        weeklyAttendance: [],
        totalMembers: 0,
        activeMembers: 0,
        averageAttendance: 0,
        engagementRate: 0,
        totalMembersChange: 0,
        attendanceRateChange: 0,
        activeMembersChange: 0,
        engagementRateChange: 0,
      });
      return;
    }

    const calculateAnalytics = () => {
      // Filter data by date range if provided
      const filteredLogs = dateRange
        ? attendanceLogs.filter(
            (log) =>
              log.checkInTimestamp >= dateRange.start &&
              log.checkInTimestamp <= dateRange.end
          )
        : attendanceLogs;

      const filteredMeetings = dateRange
        ? meetings.filter(
            (meeting) =>
              meeting.date >= dateRange.start && meeting.date <= dateRange.end
          )
        : meetings;

      // Attendance Analytics
      const totalPossibleAttendance = members.length * filteredMeetings.length;
      const actualAttendance = filteredLogs.length;
      const attendanceRate =
        totalPossibleAttendance > 0
          ? (actualAttendance / totalPossibleAttendance) * 100
          : 0;

      const averageLateness =
        filteredLogs.length > 0
          ? Math.round(
              filteredLogs.reduce((sum, log) => sum + (log.lateness || 0), 0) /
                filteredLogs.length
            )
          : 0;

      // Attendance Trend (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();

      const attendanceTrend = last30Days.map((date) => {
        const dayLogs = filteredLogs.filter(
          (log) => log.checkInTimestamp.toDateString() === date.toDateString()
        );
        const dayMeetings = filteredMeetings.filter(
          (meeting) => meeting.date.toDateString() === date.toDateString()
        );
        const possibleAttendance = members.length * dayMeetings.length;
        const rate =
          possibleAttendance > 0
            ? (dayLogs.length / possibleAttendance) * 100
            : 0;

        return {
          date: date.toLocaleDateString("ar-EG", {
            month: "short",
            day: "numeric",
          }),
          count: dayLogs.length,
          rate: Math.round(rate),
        };
      });

      // Member Attendance Stats
      const memberAttendanceStats = members
        .map((member) => {
          const memberLogs = filteredLogs.filter(
            (log) => log.memberId === member.id
          );
          const memberPossibleAttendance = filteredMeetings.length;
          const attendanceRate =
            memberPossibleAttendance > 0
              ? (memberLogs.length / memberPossibleAttendance) * 100
              : 0;

          return {
            memberId: member.id!,
            memberName: member.fullName,
            attendanceCount: memberLogs.length,
            attendanceRate: Math.round(attendanceRate),
          };
        })
        .sort((a, b) => b.attendanceRate - a.attendanceRate);

      // Members by Stage
      const stageGroups = members.reduce((acc, member) => {
        const stage = member.classStage;
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const membersByStage = Object.entries(stageGroups).map(
        ([stage, count]) => ({
          stage:
            stage === "primary"
              ? "ابتدائي"
              : stage === "preparatory"
              ? "إعدادي"
              : stage === "secondary"
              ? "ثانوي"
              : stage === "university"
              ? "جامعي"
              : stage,
          count,
        })
      );

      // Member Growth (last 12 months)
      const memberGrowth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const totalMembers = members.filter(
          (member) => member.createdAt <= monthEnd
        ).length;

        const newMembers = members.filter(
          (member) =>
            member.createdAt >= monthStart && member.createdAt <= monthEnd
        ).length;

        return {
          month: date.toLocaleDateString("ar-EG", { month: "short" }),
          total: totalMembers,
          new: newMembers,
        };
      }).reverse();

      // Post Engagement
      const postEngagement = posts
        .map((post) => {
          const likes = post.likes.length;
          const comments = post.comments.length;
          const engagement = likes + comments * 2; // Comments weighted more

          return {
            postId: post.id!,
            likes,
            comments,
            engagement,
          };
        })
        .sort((a, b) => b.engagement - a.engagement);

      // Monthly Posts (last 12 months)
      const monthlyPosts = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthPosts = posts.filter(
          (post) => post.createdAt >= monthStart && post.createdAt <= monthEnd
        ).length;

        return {
          month: date.toLocaleDateString("ar-EG", { month: "short" }),
          count: monthPosts,
        };
      }).reverse();

      // Meeting Stats
      const meetingStats = filteredMeetings
        .map((meeting) => {
          const meetingLogs = filteredLogs.filter(
            (log) => log.meetingId === meeting.id
          );
          const attendanceRate =
            members.length > 0
              ? (meetingLogs.length / members.length) * 100
              : 0;

          return {
            meetingId: meeting.id!,
            title: meeting.title,
            attendanceCount: meetingLogs.length,
            attendanceRate: Math.round(attendanceRate),
          };
        })
        .sort((a, b) => b.attendanceRate - a.attendanceRate);

      // Weekly Attendance (last 8 weeks)
      const weeklyAttendance = Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekLogs = filteredLogs.filter(
          (log) =>
            log.checkInTimestamp >= weekStart && log.checkInTimestamp <= weekEnd
        );

        return {
          week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          count: weekLogs.length,
        };
      }).reverse();

      // Performance Metrics
      const activeMembers = members.filter((member) => {
        const memberLogs = filteredLogs.filter(
          (log) => log.memberId === member.id
        );
        return memberLogs.length > 0;
      }).length;

      const averageAttendance =
        filteredMeetings.length > 0
          ? filteredLogs.length / filteredMeetings.length
          : 0;

      const totalEngagement = posts.reduce(
        (sum, post) => sum + post.likes.length + post.comments.length,
        0
      );
      const engagementRate =
        posts.length > 0 && members.length > 0
          ? (totalEngagement / (posts.length * members.length)) * 100
          : 0;

      // Calculate percentage changes vs previous period
      const previousPeriodStart = new Date(dateRange?.start || new Date());
      const previousPeriodEnd = new Date(dateRange?.end || new Date());

      if (dateRange) {
        const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
        previousPeriodEnd.setTime(previousPeriodStart.getTime() - 1);
        previousPeriodStart.setTime(previousPeriodEnd.getTime() - periodLength);
      } else {
        // Default to comparing with previous 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousPeriodEnd.setTime(thirtyDaysAgo.getTime() - 1);
        previousPeriodStart.setTime(previousPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const previousLogs = attendanceLogs.filter(
        (log) =>
          log.checkInTimestamp >= previousPeriodStart &&
          log.checkInTimestamp <= previousPeriodEnd
      );

      const previousMeetings = meetings.filter(
        (meeting) =>
          meeting.date >= previousPeriodStart && meeting.date <= previousPeriodEnd
      );

      const previousMembers = members.filter(
        (member) => member.createdAt <= previousPeriodEnd
      ).length;

      const previousActiveMembers = members.filter((member) => {
        const memberLogs = previousLogs.filter(
          (log) => log.memberId === member.id
        );
        return memberLogs.length > 0;
      }).length;

      const previousTotalPossibleAttendance = previousMembers * previousMeetings.length;
      const previousActualAttendance = previousLogs.length;
      const previousAttendanceRate =
        previousTotalPossibleAttendance > 0
          ? (previousActualAttendance / previousTotalPossibleAttendance) * 100
          : 0;

      const previousTotalEngagement = posts
        .filter((post) => post.createdAt >= previousPeriodStart && post.createdAt <= previousPeriodEnd)
        .reduce((sum, post) => sum + post.likes.length + post.comments.length, 0);
      const previousPosts = posts.filter(
        (post) => post.createdAt >= previousPeriodStart && post.createdAt <= previousPeriodEnd
      ).length;
      const previousEngagementRate =
        previousPosts > 0 && previousMembers > 0
          ? (previousTotalEngagement / (previousPosts * previousMembers)) * 100
          : 0;

      // Calculate percentage changes
      const totalMembersChange = previousMembers > 0
        ? ((members.length - previousMembers) / previousMembers) * 100
        : 0;

      const attendanceRateChange = previousAttendanceRate > 0
        ? ((attendanceRate - previousAttendanceRate) / previousAttendanceRate) * 100
        : 0;

      const activeMembersChange = previousActiveMembers > 0
        ? ((activeMembers - previousActiveMembers) / previousActiveMembers) * 100
        : 0;

      const engagementRateChange = previousEngagementRate > 0
        ? ((engagementRate - previousEngagementRate) / previousEngagementRate) * 100
        : 0;

      return {
        attendanceRate: Math.round(attendanceRate),
        averageLateness: Math.round(averageLateness),
        attendanceTrend,
        memberAttendanceStats,
        membersByStage,
        memberGrowth,
        postEngagement,
        monthlyPosts,
        meetingStats,
        weeklyAttendance,
        totalMembers: members.length,
        activeMembers,
        averageAttendance: Math.round(averageAttendance),
        engagementRate: Math.round(engagementRate),
        totalMembersChange: Math.round(totalMembersChange * 100) / 100,
        attendanceRateChange: Math.round(attendanceRateChange * 100) / 100,
        activeMembersChange: Math.round(activeMembersChange * 100) / 100,
        engagementRateChange: Math.round(engagementRateChange * 100) / 100,
      };
    };

    const analyticsData = calculateAnalytics();
    setAnalytics(analyticsData);
    setLoading(false);
  }, [members, attendanceLogs, meetings, posts, dateRange]);

  return { analytics, loading };
};
