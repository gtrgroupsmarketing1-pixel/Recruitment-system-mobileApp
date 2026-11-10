import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { convertCrmLead, fetchCrmLeads, uploadCv } from "../lib/api";

type Lead = {
  id: string;
  phoneNumber: string;
  profileName: string | null;
  lastMessage: string | null;
  adId: string | null;
  status: string;
  candidateId: string | null;
  createdAt: string;
};

export function CrmScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [trade, setTrade] = useState("");
  const [nationality, setNationality] = useState("");
  const [cv, setCv] = useState<{ key: string; url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchCrmLeads();
      setLeads(res.leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onPickCv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploading(true);
      const uploaded = await uploadCv({
        uri: asset.uri,
        name: asset.name || "cv.pdf",
        mimeType: asset.mimeType || "application/pdf",
      });
      setCv({ ...uploaded, name: asset.name || "cv.pdf" });
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload CV");
    } finally {
      setUploading(false);
    }
  };

  const onConvert = async () => {
    if (!selected) return;
    if (!trade.trim()) {
      Alert.alert("Trade required", "Enter the candidate trade / role.");
      return;
    }
    setSaving(true);
    try {
      await convertCrmLead(selected.id, {
        name: selected.profileName || "Unknown",
        phone: selected.phoneNumber,
        trade: trade.trim(),
        nationality: nationality.trim() || undefined,
        cvUrl: cv?.url,
        cvStorageKey: cv?.key,
      });
      setSelected(null);
      setTrade("");
      setNationality("");
      setCv(null);
      await load();
      Alert.alert("Converted", "Lead is now a candidate.");
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to convert lead"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && leads.length === 0) {
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
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={styles.muted}>
            No WhatsApp leads yet. New ad replies will show here.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.profileName || "Unknown"}
                </Text>
                <Text style={styles.phone}>{item.phoneNumber}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  item.status === "NEW"
                    ? styles.badgeNew
                    : item.status === "CONVERTED"
                      ? styles.badgeOk
                      : styles.badgeMuted,
                ]}
              >
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {item.lastMessage || "—"}
            </Text>
            {item.adId ? (
              <Text style={styles.source}>Meta ad</Text>
            ) : (
              <Text style={styles.source}>Organic</Text>
            )}
            {item.status !== "CONVERTED" ? (
              <TouchableOpacity
                style={styles.convertBtn}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.convertBtnText}>Convert to Candidate</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Convert lead</Text>
            <Text style={styles.modalSub}>
              {selected?.profileName || "Unknown"}
            </Text>
            <Text style={styles.modalSub}>{selected?.phoneNumber}</Text>
            <TextInput
              style={styles.input}
              placeholder="Trade * (e.g. Electrician)"
              value={trade}
              onChangeText={setTrade}
            />
            <TextInput
              style={styles.input}
              placeholder="Nationality (e.g. IN, PK)"
              value={nationality}
              onChangeText={setNationality}
            />
            <TouchableOpacity style={styles.cvBtn} onPress={onPickCv} disabled={uploading}>
              <Text style={styles.cvBtnText}>
                {uploading ? "Uploading…" : cv ? `CV: ${cv.name}` : "Attach CV (PDF)"}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelected(null)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={onConvert}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#B91C1C", padding: 12 },
  muted: { color: "#64748B", textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  phone: { fontSize: 13, color: "#64748B", marginTop: 2 },
  message: { fontSize: 14, color: "#334155", fontStyle: "italic", marginBottom: 8 },
  source: { fontSize: 11, color: "#94A3B8", marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeNew: { backgroundColor: "#DBEAFE" },
  badgeOk: { backgroundColor: "#DCFCE7" },
  badgeMuted: { backgroundColor: "#F1F5F9" },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#1E293B" },
  convertBtn: {
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  convertBtnText: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  modalSub: { fontSize: 14, color: "#64748B", marginBottom: 2 },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 14,
    marginTop: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
    alignItems: "center",
  },
  cancelBtn: { padding: 12 },
  saveBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 88,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  cvBtn: {
    marginTop: 14,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
  },
  cvBtnText: { color: "#1D4ED8", fontWeight: "600" },
});
