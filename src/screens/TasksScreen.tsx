import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,           // 👈 ADDED THIS (Critical Fix)
  RefreshControl   // 👈 ADDED THIS (Pull to refresh)
} from "react-native";
import { apiClient } from "../lib/api";

export function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/mobile/tasks"); 
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    fetchTasks(); 
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleComplete = async (taskId: string) => {
    // Optimistic UI: Remove it from the list instantly
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t: any) => t.id !== taskId));

    try {
      await apiClient.post(`/api/mobile/tasks/${taskId}/complete`);
    } catch (err) {
      Alert.alert("Error", "Failed to complete task. Please check your connection.");
      setTasks(previousTasks); // Revert if API fails
    }
  };

  if (loading && !refreshing) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No open tasks.</Text>
            <Text style={styles.emptySubText}>You're all caught up!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <TouchableOpacity style={styles.checkbox} onPress={() => handleComplete(item.id)}>
              <View style={styles.checkboxInner} />
            </TouchableOpacity>
            
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDesc}>
                {item.candidate?.name || item.requisition?.code || "General Task"}
              </Text>
              
              {/* 👇 Due Date Indicator (Productive Touch) */}
              {item.dueDate && (
                <Text style={styles.dueDate}>
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  taskCard: { 
    flexDirection: "row", 
    backgroundColor: "white", 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 12, 
    alignItems: "flex-start", // Align to top in case of multiple lines
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 6, // Square with rounded corners looks more like a task list
    borderWidth: 2, 
    borderColor: "#94A3B8", 
    marginRight: 12, 
    justifyContent: "center", 
    alignItems: "center",
    marginTop: 2
  },
  checkboxInner: { 
    width: 12, 
    height: 12, 
    borderRadius: 2, 
    backgroundColor: "transparent" 
  },
  taskTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  taskDesc: { fontSize: 14, color: "#64748B", marginTop: 4 },
  dueDate: { fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: "500" },
  
  // Empty State Styles
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 14, color: "#64748B", marginTop: 4 },
});
