import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "http://your-server-url/api"; // Replace with your server URL

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");
    setLoading(true);
    try {
      const { data } = await axios.post(API + "/auth/login", { email, password });
      await login(data.token, data.refreshToken, data.user);
    } catch(e) {
      Alert.alert("Login Failed", e.response?.data?.error || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={["#0f0e17", "#1e1b4b"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>CX</Text></View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to ConnectX</Text>
        </View>
        <View style={styles.form}>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#475569"
            keyboardType="email-address" autoCapitalize="none"
            style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#475569"
            secureTextEntry style={styles.input} />
          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={[styles.btn, loading && { opacity: 0.6 }]}>
            <LinearGradient colors={["#7c3aed", "#5b21b6"]} style={styles.btnGrad}>
              <Text style={styles.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.link}>
            <Text style={styles.linkText}>Don't have an account? <Text style={{ color: "#a78bfa" }}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#64748b", marginTop: 4 },
  form: { gap: 12 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 16, color: "#fff", fontSize: 15 },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  btnGrad: { padding: 16, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { alignItems: "center", marginTop: 8 },
  linkText: { color: "#64748b", fontSize: 14 },
});
