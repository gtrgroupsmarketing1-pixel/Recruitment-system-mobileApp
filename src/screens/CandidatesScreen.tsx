import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { fetchCandidates } from "../lib/api";

export function CandidatesScreen() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchCandidates>>["candidates"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query?: string) => {
    setError(null);
    setLoading(true);
    try {
      setRows((await fetchCandidates(query)).candidates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search name or phone"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => load(q)}
        returnKeyType="search"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && rows.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => load(q)} />
          }
          ListEmptyComponent={
            <Text style={styles.muted}>No candidates found</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.fullName}</Text>
              <Text style={styles.muted}>
                {[item.phone, item.nationality, item.portalStatus]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 12 },
  search: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  error: { color: "#B91C1C", marginBottom: 8 },
  muted: { color: "#64748B", fontSize: 13 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: { fontWeight: "700", color: "#0F172A" },
});
