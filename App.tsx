import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { getToken } from "./src/lib/auth";
import { LoginScreen } from "./src/screens/LoginScreen";
import { IntakeScreen } from "./src/screens/IntakeScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    getToken().then((t) => {
      setAuthed(Boolean(t));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      {authed ? (
        <IntakeScreen onLogout={() => setAuthed(false)} />
      ) : (
        <LoginScreen onLoggedIn={() => setAuthed(true)} />
      )}
    </>
  );
}
