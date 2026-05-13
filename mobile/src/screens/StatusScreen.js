import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";

export default function StatusScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ color: "#a78bfa", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Status</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.body}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
        <Text style={styles.bodyText}>Status Screen</Text>
        <Text style={styles.bodySubText}>Full implementation in the source code</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0e17" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  back: { width: 60 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  bodyText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  bodySubText: { color: "#64748b", marginTop: 8 },
});
