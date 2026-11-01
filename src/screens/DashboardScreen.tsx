import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { fetchDashboard } from "../lib/api";

export function DashboardScreen() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchDashboard>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchDashboard());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const kpis = data?.kpis ?? {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.greeting}>
        Hello, {data?.user?.name || data?.user?.email || "Recruiter"}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {String(kpis.activeReqs ?? "—")}
          </Text>
          <Text style={styles.kpiLabel}>Active jobs</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {String(kpis.pendingTasks ?? "—")}
          </Text>
          <Text style={styles.kpiLabel}>Open tasks</Text>
        </View>
      </View>

      {data?.user?.role === "TENANT_ADMIN" ? (
        <View style={styles.adminBox}>
          <Text style={styles.adminTitle}>Agency snapshot</Text>
          <Text style={styles.adminLine}>
            Pipeline in process: {String(kpis.pipelineCount ?? "—")}
          </Text>
          <Text style={styles.adminLine}>
            Compliance alerts: {String(kpis.complianceAlerts ?? "—")}
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>Today&apos;s tasks</Text>
      {(data?.todayTasks ?? []).length === 0 ? (
        <Text style={styles.muted}>No tasks due today</Text>
      ) : (
        (data?.todayTasks ?? []).slice(0, 5).map((t) => (
          <View key={t.id} style={styles.row}>
            <Text style={styles.rowTitle}>{t.title}</Text>
            {t.isOverdue ? (
              <Text style={styles.overdue}>Overdue</Text>
            ) : null}
          </View>
        ))
      )}

      <Text style={styles.section}>Urgent requisitions</Text>
      {(data?.urgentRequisitions ?? []).length === 0 ? (
        <Text style={styles.muted}>None</Text>
      ) : (
        (data?.urgentRequisitions ?? []).slice(0, 5).map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.rowTitle}>
              {r.reqCode} · {r.clientName}
            </Text>
            <Text style={styles.muted}>
              {r.daysLeft == null
                ? "No SLA"
                : r.daysLeft < 0
                  ? `${Math.abs(r.daysLeft)}d overdue`
                  : `${r.daysLeft}d left`}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 12 },
  error: { color: "#B91C1C", marginBottom: 8 },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kpiValue: { fontSize: 26, fontWeight: "700", color: "#2563EB" },
  kpiLabel: { fontSize: 13, color: "#64748B", marginTop: 4 },
  adminBox: {
    backgroundColor: "#E0E7FF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  adminTitle: { fontWeight: "700", color: "#3730A3", marginBottom: 6 },
  adminLine: { color: "#4338CA", marginBottom: 2 },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rowTitle: { fontWeight: "600", color: "#0F172A" },
  muted: { color: "#64748B", fontSize: 13, marginTop: 2 },
  overdue: { color: "#DC2626", fontSize: 12, marginTop: 2 },
});
