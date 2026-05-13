import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

// Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OTPScreen from "../screens/OTPScreen";
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import CallsScreen from "../screens/CallsScreen";
import StatusScreen from "../screens/StatusScreen";
import AIScreen from "../screens/AIScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon component
const TabIcon = ({ label, emoji, focused }) => (
  <View style={{ alignItems: "center" }}>
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    <Text style={{ fontSize: 10, color: focused ? "#7c3aed" : "#64748b", marginTop: 2 }}>{label}</Text>
  </View>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#16213e",
          borderTopColor: "rgba(255,255,255,0.05)",
          paddingBottom: 8, paddingTop: 8, height: 65,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Chats" emoji="💬" focused={focused} /> }} />
      <Tab.Screen name="Status" component={StatusScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Status" emoji="⚡" focused={focused} /> }} />
      <Tab.Screen name="Calls" component={CallsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Calls" emoji="📞" focused={focused} /> }} />
      <Tab.Screen name="AI" component={AIScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="AI" emoji="🤖" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Me" emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: "card" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
