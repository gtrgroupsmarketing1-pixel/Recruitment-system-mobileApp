import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { completeTask, fetchTasks } from "../lib/api";

type Task = {
  id: string;
  title: string;
  description: string | null;
  isOverdue: boolean;
  priority: string;
  context: { label: string } | null;
};

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchTasks("open");
      setTasks(res.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onComplete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await completeTask(id);
    } catch {
      load();
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={styles.muted}>No open tasks. You are clear.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => onComplete(item.id)}
              style={styles.check}
            >
              <Text style={styles.checkMark}>☐</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              {item.context ? (
                <Text style={styles.ctx}>{item.context.label}</Text>
              ) : null}
              {item.isOverdue ? (
                <Text style={styles.overdue}>Overdue · {item.priority}</Text>
              ) : (
                <Text style={styles.muted}>{item.priority}</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#B91C1C", padding: 8 },
  muted: { color: "#64748B", textAlign: "center", marginTop: 40 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  check: { paddingTop: 2 },
  checkMark: { fontSize: 22, color: "#64748B" },
  title: { fontWeight: "600", color: "#0F172A" },
  ctx: { fontSize: 12, color: "#475569", marginTop: 2 },
  overdue: { fontSize: 12, color: "#DC2626", marginTop: 2 },
});
