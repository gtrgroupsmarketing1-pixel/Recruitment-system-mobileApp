import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { authFetch, clearToken } from "../lib/auth";

type Parsed = {
  intent: string;
  confidence: number;
  requisition?: {
    clientName: string | null;
    jobTitle: string | null;
    roleCategory: string;
    country: string;
    quantity: number | null;
    location: string | null;
    notes: string | null;
  };
  candidate?: {
    fullName: string | null;
    phone: string | null;
    email: string | null;
    trade: string | null;
    notes: string | null;
  };
};

type Props = { onLogout: () => void };

export function IntakeScreen({ onLogout }: Props) {
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/mobile/intake/parse", {
        method: "POST",
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setParsed(data);
      if (data.intent === "REQUISITION" && data.requisition) {
        const r = data.requisition;
        setForm({
          clientName: r.clientName ?? "",
          jobTitle: r.jobTitle ?? "",
          roleCategory: r.roleCategory ?? "BC",
          country: r.country ?? "AE",
          quantity: String(r.quantity ?? 1),
          notes: r.notes ?? inputText,
        });
      } else if (data.intent === "CANDIDATE" && data.candidate) {
        const c = data.candidate;
        setForm({
          fullName: c.fullName ?? "",
          phone: c.phone ?? "",
          email: c.email ?? "",
          notes: c.notes ?? inputText,
        });
      } else {
        Alert.alert("Could not detect", "Edit as requisition or try clearer text.");
        setForm({
          clientName: "",
          jobTitle: "",
          roleCategory: "BC",
          country: "AE",
          quantity: "1",
          notes: inputText,
        });
        setParsed({ ...data, intent: "REQUISITION" });
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const type = parsed?.intent === "CANDIDATE" ? "CANDIDATE" : "REQUISITION";
      const data =
        type === "CANDIDATE"
          ? {
              fullName: form.fullName,
              phone: form.phone,
              email: form.email || undefined,
              notes: form.notes,
            }
          : {
              clientName: form.clientName,
              jobTitle: form.jobTitle,
              roleCategory: form.roleCategory || "BC",
              country: form.country || "AE",
              quantity: Number(form.quantity || 1),
              notes: form.notes,
            };
      const res = await authFetch("/api/mobile/intake/save", {
        method: "POST",
        body: JSON.stringify({ type, data }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Save failed");
      Alert.alert("Saved", type === "CANDIDATE" ? `Candidate ${body.id}` : `Req ${body.reqCode}`);
      setInputText("");
      setParsed(null);
      setForm({});
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await clearToken();
    onLogout();
  };

  if (parsed) {
    const isCand = parsed.intent === "CANDIDATE";
    return (
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.title}>Confirm details</Text>
        <Text style={styles.badge}>{parsed.intent}</Text>
        {isCand ? (
          <>
            <Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </>
        ) : (
          <>
            <Field label="Client name" value={form.clientName} onChange={(v) => setForm({ ...form, clientName: v })} />
            <Field label="Job title" value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
            <Field label="Role code (BC/WC)" value={form.roleCategory} onChange={(v) => setForm({ ...form, roleCategory: v })} />
            <Field label="Country (AE/SA/...)" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            <Field label="Quantity" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" />
          </>
        )}
        <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} multiline />
        <Pressable style={styles.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm & Save</Text>}
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setParsed(null)}>
          <Text>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>Intake</Text>
        <Pressable onPress={logout}>
          <Text style={styles.link}>Log out</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>Paste a WhatsApp job order or candidate note</Text>
      <TextInput
        style={[styles.input, styles.area]}
        multiline
        placeholder="e.g. Need 5 electricians for Dubai client Sammut Marine..."
        value={inputText}
        onChangeText={setInputText}
      />
      <Pressable style={styles.btn} onPress={handleParse} disabled={loading || !inputText.trim()}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Parse text</Text>}
      </Pressable>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.area]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 24, backgroundColor: "#f8fafc" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  sub: { color: "#64748b", marginVertical: 12 },
  link: { color: "#2563eb" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  label: { fontSize: 13, color: "#475569", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  area: { minHeight: 100, textAlignVertical: "top" },
  btn: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  secondary: { alignItems: "center", marginTop: 16 },
});
