import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { clearToken } from "../lib/auth";
import { DashboardScreen } from "./DashboardScreen";
import { TasksScreen } from "./TasksScreen";
import { RequisitionsScreen } from "./RequisitionsScreen";
import { CandidatesScreen } from "./CandidatesScreen";
import { IntakeScreen } from "./IntakeScreen";

type Tab = "home" | "jobs" | "candidates" | "tasks" | "intake";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "jobs", label: "Jobs" },
  { id: "candidates", label: "Talent" },
  { id: "tasks", label: "Tasks" },
  { id: "intake", label: "Intake" },
];

export function HomeShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>Recruitment OS</Text>
        <TouchableOpacity
          onPress={async () => {
            await clearToken();
            onLogout();
          }}
        >
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        {tab === "home" ? <DashboardScreen /> : null}
        {tab === "jobs" ? <RequisitionsScreen /> : null}
        {tab === "candidates" ? <CandidatesScreen /> : null}
        {tab === "tasks" ? <TasksScreen /> : null}
        {tab === "intake" ? <IntakeScreen onLogout={onLogout} embedded /> : null}
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.tab}
            onPress={() => setTab(t.id)}
          >
            <Text
              style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  brand: { fontWeight: "800", fontSize: 16, color: "#0F172A" },
  logout: { color: "#2563EB", fontWeight: "600" },
  body: { flex: 1 },
  tabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#fff",
    paddingBottom: 6,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  tabLabelActive: { color: "#0F172A" },
});
