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
  Alert,
} from "react-native";
import { fetchCandidates, apiClient } from "../lib/api"; // Added apiClient import

export function CandidatesScreen() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchCandidates>>["candidates"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // 👇 New State for Job Picker
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLinking, setIsLinking] = useState(false);

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

  // 👇 Function to fetch jobs when opening the picker
  const handleOpenJobPicker = async () => {
    try {
      const res = await apiClient.get("/api/mobile/requisitions");
      const list =
        (res.data as { requisitions?: unknown[] })?.requisitions || [];
      setJobs(list as any[]);
      setShowJobPicker(true);
      if (!list.length) {
        Alert.alert(
          "No open jobs",
          "There are no active requisitions available."
        );
      }
    } catch (err: unknown) {
      const detail =
        err instanceof Error ? err.message : String(err ?? "Unknown error");
      console.error("[CandidatesScreen] load jobs failed:", detail);
      Alert.alert("Could not load active jobs", detail);
    }
  };

  const handleLinkToJob = async (jobId: string) => {
    if (!selectedCandidate) return;
    try {
      setIsLinking(true);
      // Canonical mobile link endpoint (not /requisitions/:id/applications)
      await apiClient.post("/api/mobile/applications", {
        candidateId: selectedCandidate.id,
        requisitionId: jobId,
      });
      Alert.alert("Success", `${selectedCandidate.fullName} added to pipeline!`);
      setShowJobPicker(false);
      setSelectedCandidate(null);
    } catch (err: unknown) {
      const detail =
        err instanceof Error ? err.message : String(err ?? "Failed to add to job");
      console.error("[CandidatesScreen] link failed:", detail);
      Alert.alert("Could not link candidate", detail);
    } finally {
      setIsLinking(false);
    }
  };

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

      {/* Candidate Details Modal */}
      <Modal
        visible={!!selectedCandidate && !showJobPicker}
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

                <Text style={styles.detailLabel}>Trade / Role</Text>
                <Text style={styles.detailValue}>{selectedCandidate.trade || "Not specified"}</Text>

                <Text style={styles.detailLabel}>Nationality</Text>
                <Text style={styles.detailValue}>{selectedCandidate.nationality || "N/A"}</Text>

                <Text style={styles.detailLabel}>Portal Status</Text>
                <Text style={styles.detailValue}>{selectedCandidate.portalStatus || "N/A"}</Text>
              </View>
            )}
            
            {/* 👇 Wired up button to open job picker */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOpenJobPicker}
            >
              <Text style={styles.actionButtonText}>Add to Requisition</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 👇 Job Picker Modal */}
      <Modal
        visible={showJobPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowJobPicker(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.jobPickerContent}>
            <Text style={styles.jobPickerTitle}>Select a Requisition</Text>
            
            {isLinking ? (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={jobs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.jobItem}
                    onPress={() => handleLinkToJob(item.id)}
                  >
                    <Text style={styles.jobItemTitle}>{item.title}</Text>
                    <Text style={styles.jobItemSub}>{item.clientName || "Unknown Client"}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: "center", color: "#64748B", marginVertical: 20 }}>
                    No active jobs found.
                  </Text>
                }
              />
            )}

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setShowJobPicker(false)}
              disabled={isLinking}
            >
              <Text style={styles.cancelText}>Cancel</Text>
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
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", 
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
  
  detailRow: { marginBottom: 20 },
  detailLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
  detailValue: { fontSize: 16, color: "#0F172A", fontWeight: "500", marginBottom: 16 },
  
  actionButton: {
    backgroundColor: "#10B981", // Made it green to stand out
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: "auto",
  },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // 👇 Job Picker Modal Styles
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  jobPickerContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  jobPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 16,
    textAlign: "center",
  },
  jobItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  jobItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  jobItemSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: "center",
    padding: 10,
  },
  cancelText: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 15,
  }
});
