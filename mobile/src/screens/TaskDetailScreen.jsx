import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { showAlert } from '../shared/services/themedAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { taskApi } from '../shared/api/task';
import { useAuthStore } from '../shared/store/authStore';
import { colors, spacing, radius, fonts } from '../shared/theme';
import Avatar from '../components/Avatar';
function formatDueDate(dateStr) {
  if (!dateStr) return 'No due date';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
function statusMeta(status) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        color: colors.success,
      };
    case 'reopened':
      return {
        label: 'Re-opened',
        color: colors.goldDeep,
      };
    default:
      return {
        label: 'Pending',
        color: colors.goldDeep,
      };
  }
}
export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);
  const load = useCallback(async () => {
    try {
      const data = await taskApi.getById(taskId);
      setTask(data);
    } catch {
      showAlert('Error', 'Could not load task');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [taskId, navigation]);
  useEffect(() => {
    load();
  }, [load]);
  const handleToggle = useCallback(async () => {
    if (!task) return;
    try {
      const updated =
        task.status === 'completed'
          ? await taskApi.reopen(task.id)
          : await taskApi.complete(task.id);
      setTask(updated);
    } catch (e) {
      showAlert('Error', e?.response?.data?.error || 'Could not update task');
    }
  }, [task]);
  const handleDelete = useCallback(() => {
    showAlert('Delete Task', 'This action cannot be undone.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await taskApi.delete(taskId);
            navigation.goBack();
          } catch {
            showAlert('Error', 'Could not delete task');
          }
        },
      },
    ]);
  }, [taskId, navigation]);
  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  const isDone = task.status === 'completed';
  const sm = statusMeta(task.status);
  const isAssignee = task.assignees.some((a) => a.id === currentUser?.id);
  const canComplete = isAssignee && !isDone;
  const canReopen =
    isDone && (currentUser?.role === 'admin' || task.completedBy?.id === currentUser?.id);
  const canEdit = currentUser?.id === task.createdBy.id || currentUser?.role === 'admin';
  const assigneeNames = task.assignees.map((a) => a.displayName).join(', ');
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />

      {/* ── Header: back + title (SCREEN 18) ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Large title (SCREEN 18) */}
        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>

        {/* Meta rows (SCREEN 18): Assigned to / Due date / Created by / Points / Status */}
        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Assigned to</Text>
            {task.assignees.length > 0 ? (
              <View style={styles.assigneeStack}>
                {task.assignees.map((a, i) => (
                  <Avatar
                    key={a.id}
                    url={a.avatarUrl}
                    emoji={a.avatarEmoji}
                    name={a.displayName}
                    id={a.id}
                    size={26}
                    style={i > 0 && styles.assigneeStackOverlap}
                  />
                ))}
                <Text style={styles.metaValue}>{assigneeNames}</Text>
              </View>
            ) : (
              <Text style={styles.metaValue}>Unassigned</Text>
            )}
          </View>
          <MetaRow label="Assigned by" value={task.createdBy.displayName} />
          <MetaRow label="Due date" value={formatDueDate(task.dueDate)} />
          
          <MetaRow label="Points" value={String(task.points)} mono />
          <MetaRow label="Status" value={sm.label} color={sm.color} semibold last />
        </View>
      </ScrollView>

      {/* ── Bottom actions (SCREEN 18) ──
          Docked in normal flow directly above the tab bar (same as the
          ScrollView above it) — it doesn't need to add the device's
          safe-area inset or guess the dock's height itself; the dock
          already reserves its own space and pads for that inset. */}
      <View style={styles.actions}>
        {canComplete ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleToggle} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Mark complete</Text>
          </TouchableOpacity>
        ) : canReopen ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleToggle} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Mark as Pending</Text>
          </TouchableOpacity>
        ) : null}

        {canEdit && (
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() =>
              navigation.navigate('CreateTask', {
                taskId: task.id,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>Edit task</Text>
          </TouchableOpacity>
        )}

        {canEdit && (
          <TouchableOpacity style={styles.deleteLink} onPress={handleDelete} activeOpacity={0.6}>
            <Text style={styles.deleteLinkText}>Delete task</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
function MetaRow({ label, value, mono, color, semibold, last }) {
  return (
    <View style={[styles.metaRow, last && styles.metaRowLast]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text
        style={[
          styles.metaValue,
          mono && styles.metaValueMono,
          semibold && styles.metaValueSemibold,
          color
            ? {
                color,
              }
            : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  // Header (SCREEN 18): back chevron + title, left-aligned with a gap
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 56,
    paddingHorizontal: spacing.xxl,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.ink,
    fontWeight: '700',
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 20,
  },
  // Title (SCREEN 18)
  taskTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 26,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  // Meta rows
  metaList: {},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  metaRowLast: {
    borderBottomWidth: 0,
  },
  assigneeStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assigneeStackOverlap: {
    marginLeft: -10,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  metaValueMono: {
    fontFamily: fonts.mono,
  },
  metaValueSemibold: {
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  // Bottom actions
  actions: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: 12,
  },
  primaryBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.onAccent,
  },
  outlineBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
  },
});
