import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { apiClient } from "../lib/api";

export function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      // Assuming you have an endpoint to get tasks
      const res = await apiClient.get("/api/mobile/tasks"); 
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleComplete = async (taskId: string) => {
    // Optimistic UI: Remove it from the list instantly
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t: any) => t.id !== taskId));

    try {
      // Assuming you have an endpoint to complete a task
      await apiClient.post(`/api/mobile/tasks/${taskId}/complete`);
    } catch (err) {
      Alert.alert("Error", "Failed to complete task");
      setTasks(previousTasks); // Revert if API fails
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: "#64748B" }}>No open tasks. You're all caught up!</Text>}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <TouchableOpacity style={styles.checkbox} onPress={() => handleComplete(item.id)}>
              <View style={styles.checkboxInner} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDesc}>{item.candidate?.name || item.requisition?.code || "General Task"}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  taskCard: { flexDirection: "row", backgroundColor: "white", padding: 16, borderRadius: 8, marginBottom: 12, alignItems: "center" },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#94A3B8", marginRight: 12, justifyContent: "center", alignItems: "center" },
  checkboxInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "transparent" }, // Turns green on press
  taskTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  taskDesc: { fontSize: 14, color: "#64748B", marginTop: 4 },
});
