import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { fetchRequisitions } from "../lib/api";
import { authFetch } from "../lib/auth"; // 👈 Added to fetch details and update status

const PIPELINE_STAGES = ["SOURCED", "SCREENED", "SHORTLISTED", "SUBMITTED", "DEPLOYED"];

export function RequisitionsScreen() {
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchRequisitions>>["requisitions"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for the Job Details Modal
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // 👇 NEW: Fetch detailed pipeline data when a job is tapped
  const openJob = async (job: any) => {
    setSelectedJob(job);
    setLoadingDetails(true);
    try {
      const res = await authFetch(`/api/mobile/requisitions/${job.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setJobDetails(data.requisition);
    } catch (err) {
      Alert.alert("Error", "Could not load pipeline details");
      setSelectedJob(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // 👇 NEW: Move candidate to the next stage
  const advanceStatus = async (appId: string, currentStatus: string) => {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === PIPELINE_STAGES.length - 1) return;
    const nextStatus = PIPELINE_STAGES[currentIndex + 1];

    try {
      const res = await authFetch(`/api/mobile/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update");

      // Update UI instantly
      setJobDetails((prev: any) => ({
        ...prev,
        applications: prev.applications.map((app: any) => 
          app.id === appId ? { ...app, status: nextStatus } : app
        )
      }));
    } catch (err) {
      Alert.alert("Error", "Failed to advance candidate status");
    }
  };

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
          // 👇 Wrapped in TouchableOpacity to open the modal
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => openJob(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.code}>{item.reqCode}</Text>
            <Text style={styles.title}>
              {item.roleCategory} · {item.clientName}
            </Text>
            <Text style={styles.muted}>
              {item.mobilized}/{item.vacancyTarget} filled · {item.status}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 👇 NEW: JOB PIPELINE MODAL */}
      <Modal visible={!!selectedJob} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedJob?.roleCategory} · {selectedJob?.clientName}</Text>
                <Text style={styles.modalSub}>{selectedJob?.reqCode}</Text>
              </View>
              <Pressable onPress={() => setSelectedJob(null)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            {loadingDetails ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : jobDetails ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Candidates in Pipeline</Text>
                
                <FlatList
                  data={jobDetails.applications || []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.appCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.appName}>{item.candidate?.name || "Unknown"}</Text>
                        <Text style={styles.appTrade}>{item.candidate?.trade || "No trade"}</Text>
                      </View>
                      
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.appStatus}>{item.status}</Text>
                        {item.status !== "DEPLOYED" && (
                          <TouchableOpacity 
                            style={styles.advanceBtn}
                            onPress={() => advanceStatus(item.id, item.status)}
                          >
                            <Text style={styles.advanceBtnText}>Next Step ➔</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: "#64748B" }}>No candidates in pipeline yet.</Text>}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

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
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  modalSub: { fontSize: 14, color: "#64748B", marginTop: 4, fontFamily: "monospace" },
  closeText: { color: "#2563EB", fontWeight: "600", fontSize: 16 },
  
  // Pipeline Styles
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 15 },
  appCard: { flexDirection: "row", backgroundColor: "#F8FAFC", padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  appName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  appTrade: { fontSize: 13, color: "#64748B" },
  appStatus: { fontSize: 11, fontWeight: "bold", color: "#2563EB", backgroundColor: "#DBEAFE", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  advanceBtn: { backgroundColor: "#10B981", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  advanceBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});