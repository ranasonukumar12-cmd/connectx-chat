import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, SafeAreaView } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState([]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ConnectX</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={styles.settingsBtn}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search chats..."
        placeholderTextColor="#475569" style={styles.search} />
      <View style={styles.empty}>
        <Text style={{ fontSize: 48 }}>💬</Text>
        <Text style={styles.emptyTitle}>No chats yet</Text>
        <Text style={styles.emptySubtitle}>Search for users to start a conversation</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0e17" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  search: { marginHorizontal: 20, marginBottom: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, color: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 12 },
  emptySubtitle: { color: "#64748b", marginTop: 4, textAlign: "center", paddingHorizontal: 40 },
});
