import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { login } from "../lib/auth";
import { API_URL } from "../lib/config";

type Props = { onLoggedIn: () => void };

function toMessage(e: unknown): string {
  if (e instanceof Error) return e.message || "Error";
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export function LoginScreen({ onLoggedIn }: Props) {
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      onLoggedIn();
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.version}>build 3413c65+mem</Text>
      <Text style={styles.title}>Recruitment OS</Text>
      <Text style={styles.sub}>Field intake — sign in</Text>
      <Text style={styles.api} numberOfLines={3}>
        {API_URL}
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Sign in</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" },
  version: { fontSize: 10, color: "#94a3b8", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#64748b", marginBottom: 4 },
  api: { fontSize: 11, color: "#64748b", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
