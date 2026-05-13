import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  return (
    <LinearGradient colors={["#0f0e17", "#1e1b4b", "#0f0e17"]} style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>CX</Text>
      </View>
      <Text style={styles.title}>ConnectX</Text>
      <Text style={styles.subtitle}>Chat. Connect. Evolve.</Text>
      <View style={styles.dots}>
        {[0,1,2].map(i => <View key={i} style={styles.dot} />)}
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  subtitle: { color: "#64748b", fontSize: 14, marginTop: 8 },
  dots: { flexDirection: "row", gap: 6, marginTop: 48 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7c3aed", opacity: 0.7 },
});
