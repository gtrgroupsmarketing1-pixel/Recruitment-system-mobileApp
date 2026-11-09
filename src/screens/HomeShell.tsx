import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 👈 USE THIS INSTEAD
import { clearToken } from "../lib/auth";
import { DashboardScreen } from "./DashboardScreen";
import { TasksScreen } from "./TasksScreen";
import { RequisitionsScreen } from "./RequisitionsScreen";
import { CandidatesScreen } from "./CandidatesScreen";
import { IntakeScreen } from "./IntakeScreen";
import { CrmScreen } from "./CrmScreen";

type Tab = "home" | "jobs" | "candidates" | "tasks" | "leads" | "intake";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "jobs", label: "Jobs" },
  { id: "leads", label: "Leads" },
  { id: "candidates", label: "Talent" },
  { id: "tasks", label: "Tasks" },
  { id: "intake", label: "Intake" },
];

export function HomeShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const insets = useSafeAreaInsets(); // 👈 GET INSETS

  return (
    <View style={styles.safe}>
      {/* 👇 Add paddingTop so it clears the camera notch */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
        {tab === "leads" ? <CrmScreen /> : null}
        {tab === "intake" ? <IntakeScreen onLogout={onLogout} embedded /> : null}
      </View>

      {/* 👇 Add paddingBottom so it clears the Android navigation bar */}
      <View style={[styles.tabs, { paddingBottom: insets.bottom || 6 }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10, // Changed from paddingVertical to separate top/bottom
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
    // Removed paddingBottom: 6; it's now dynamic above
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  tabLabelActive: { color: "#0F172A" },
});
