"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import HomeScreen from "./screens/HomeScreen"
import AddCallScreen from "./screens/AddCallScreen"
import { CallProvider } from "./context/CallContext"
import { useEffect } from "react"
import * as Notifications from "expo-notifications"
import { createNotificationChannels } from "./services/NotificationService"

const Stack = createNativeStackNavigator()

export default function App() {
  useEffect(() => {
    // Create notification channels on app start
    createNotificationChannels()

    // Request notification permissions
    Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    })
  }, [])

  return (
    <CallProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddCall"
            component={AddCallScreen}
            options={{
              title: "Schedule Call",
              headerStyle: {
                backgroundColor: "#fff",
              },
              headerTintColor: "#e74c3c",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CallProvider>
  )
}
