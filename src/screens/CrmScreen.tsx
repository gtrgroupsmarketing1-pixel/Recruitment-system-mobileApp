import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { apiClient } from "../lib/api"; // Assuming you have your axios/fetch setup here

export function CrmScreen() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [trade, setTrade] = useState("");

  // 1. Fetch Leads
  const fetchLeads = async () => {
    try {
      const res = await apiClient.get("/api/mobile/crm/leads");
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  // 2. Convert Action
  const handleConvert = async () => {
    if (!trade) return Alert.alert("Error", "Please enter a trade (e.g. Electrician)");
    try {
      await apiClient.post(`/api/mobile/crm/leads/${selectedLead.id}/convert`, {
        name: selectedLead.profileName || "Unknown",
        phone: selectedLead.phoneNumber,
        trade: trade,
        nationality: "Unknown",
      });
      Alert.alert("Success", "Lead converted to Candidate!");
      setSelectedLead(null);
      setTrade("");
      fetchLeads(); // Refresh list
    } catch (err) {
      Alert.alert("Error", "Failed to convert lead.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.profileName || "Unknown"}</Text>
              <Text style={styles.badge}>{item.status}</Text>
            </View>
            <Text style={styles.phone}>{item.phoneNumber}</Text>
            <Text style={styles.message} numberOfLines={2}>"{item.lastMessage}"</Text>
            
            {/* Show Convert Button only if status is NEW */}
            {item.status === "NEW" && (
              <TouchableOpacity style={styles.convertBtn} onPress={() => setSelectedLead(item)}>
                <Text style={styles.convertText}>Convert to Candidate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Conversion Modal */}
      <Modal visible={!!selectedLead} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Convert {selectedLead?.profileName}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Trade (e.g. Forklift Operator)"
              value={trade}
              onChangeText={setTrade}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setSelectedLead(null)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConvert}><Text style={{ color: "white" }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  card: { backgroundColor: "white", padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  name: { fontSize: 16, fontWeight: "bold", color: "#0F172A" },
  badge: { fontSize: 12, backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, color: "#166534", overflow: "hidden" },
  phone: { fontSize: 14, color: "#64748B", marginBottom: 8 },
  message: { fontSize: 14, fontStyle: "italic", color: "#334155", marginBottom: 12 },
  convertBtn: { backgroundColor: "#2563EB", padding: 10, borderRadius: 6, alignItems: "center" },
  convertText: { color: "white", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", padding: 12, borderRadius: 8, marginBottom: 16 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 16, alignItems: "center" },
  saveBtn: { backgroundColor: "#10B981", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
});
