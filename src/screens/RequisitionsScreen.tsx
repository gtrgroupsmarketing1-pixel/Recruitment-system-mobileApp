import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { fetchRequisitions } from "../lib/api";

export function RequisitionsScreen() {
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchRequisitions>>["requisitions"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows((await fetchRequisitions()).requisitions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && rows.length === 0) {
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
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={styles.muted}>No open requisitions</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.reqCode}</Text>
            <Text style={styles.title}>
              {item.roleCategory} · {item.clientName}
            </Text>
            <Text style={styles.muted}>
              {item.mobilized}/{item.vacancyTarget} filled · {item.status}
            </Text>
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
  muted: { color: "#64748B", fontSize: 13 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  code: { fontSize: 12, color: "#64748B", fontFamily: "monospace" },
  title: { fontWeight: "700", color: "#0F172A", marginTop: 2 },
});
