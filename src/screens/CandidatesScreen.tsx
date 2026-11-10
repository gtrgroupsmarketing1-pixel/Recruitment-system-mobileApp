import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { fetchCandidates } from "../lib/api";

export function CandidatesScreen() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchCandidates>>["candidates"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the selected candidate modal
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

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
            // 👇 WRAPPED IN TOUCHABLE OPACITY
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => setSelectedCandidate(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.title}>{item.fullName}</Text>
              <Text style={styles.muted}>
                {[item.phone, item.nationality, item.portalStatus]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* 👇 CANDIDATE DETAILS MODAL */}
      <Modal
        visible={!!selectedCandidate}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedCandidate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Candidate Profile</Text>
              <Pressable onPress={() => setSelectedCandidate(null)} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            {selectedCandidate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedCandidate.fullName}</Text>

                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedCandidate.phone || "N/A"}</Text>

                <Text style={styles.detailLabel}>Nationality</Text>
                <Text style={styles.detailValue}>{selectedCandidate.nationality || "N/A"}</Text>

                <Text style={styles.detailLabel}>Portal Status</Text>
                <Text style={styles.detailValue}>{selectedCandidate.portalStatus || "N/A"}</Text>
              </View>
            )}
            
            {/* If you want to add actions here later (e.g. Add to Job), you can put them below */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Add to Requisition</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  title: { fontWeight: "700", color: "#0F172A", fontSize: 16 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", // Slides up from bottom
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  closeBtn: { padding: 5 },
  closeText: { color: "#2563EB", fontWeight: "600", fontSize: 16 },
  
  // Detail Row Styles
  detailRow: { marginBottom: 20 },
  detailLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
  detailValue: { fontSize: 16, color: "#0F172A", fontWeight: "500", marginBottom: 16 },
  
  // Action Button
  actionButton: {
    backgroundColor: "#0F172A",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: "auto",
  },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
