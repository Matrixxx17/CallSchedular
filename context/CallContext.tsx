"use client"

import type React from "react"
import { useState, useEffect, useRef, createContext } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import * as Linking from "expo-linking"
import { CallNotification } from "../components/CallNotification"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Define the context type
interface Call {
  id: string
  title: string
  date: string
  contactName: string
  contactPhone: string
  notificationId?: string
}

interface CallContextType {
  scheduledCalls: Call[]
  addCall: (call: Call) => void
  removeCall: (id: string) => void
}

// Create the context
export const CallContext = createContext<CallContextType>({
  scheduledCalls: [],
  addCall: () => {},
  removeCall: () => {},
})

// Create the provider component
export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheduledCalls, setScheduledCalls] = useState<Call[]>([])
  const [activeCallNotification, setActiveCallNotification] = useState(null)
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)
  const checkCallsIntervalRef = useRef(null)

  // Load saved calls from storage on app start
  useEffect(() => {
    const loadCalls = async () => {
      try {
        const savedCalls = await AsyncStorage.getItem("scheduledCalls")
        if (savedCalls) {
          setScheduledCalls(JSON.parse(savedCalls))
        }
      } catch (error) {
        console.error("Failed to load calls from storage", error)
      }
    }

    loadCalls()

    // Set up notification listeners
    setupNotifications()

    return () => {
      // Clean up notification listeners
      Notifications.dismissAllNotificationsAsync()
    }
  }, [])

  // Save calls to storage whenever they change
  useEffect(() => {
    const saveCalls = async () => {
      try {
        await AsyncStorage.setItem("scheduledCalls", JSON.stringify(scheduledCalls))
      } catch (error) {
        console.error("Failed to save calls to storage", error)
      }
    }

    saveCalls()
  }, [scheduledCalls])

  // Set up notification handling
  const setupNotifications = async () => {
    // Import and initialize the notification service
    const {
      initializeNotifications,
      createNotificationChannels,
      setupNotificationListeners,
    } = require("../services/NotificationService")

    // Initialize notifications
    await initializeNotifications()

    // Create notification channels (for Android)
    await createNotificationChannels()

    // Set up notification listeners
    const unsubscribe = setupNotificationListeners((response) => {
      const data = response.notification.request.content.data
      const actionId = response.actionIdentifier

      // If user tapped the notification or pressed "Call Now"
      if (actionId === "CALL_NOW" || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        if (data.phoneNumber) {
          // Make the phone call
          Linking.openURL(`tel:${data.phoneNumber}`)

          // Remove the call from scheduled calls if it was a one-time call
          if (data.callId) {
            removeCall(data.callId)
          }
        }
      }
    })

    return unsubscribe
  }

  // Schedule a notification for a call
  const scheduleCallNotification = async (call: Call) => {
    const { scheduleCallNotification: scheduleNotification } = require("../services/NotificationService")

    // Schedule the notification using the service
    const notificationId = await scheduleNotification(call)

    // Store the notification ID with the call for later reference
    if (notificationId) {
      setScheduledCalls((prevCalls) => prevCalls.map((c) => (c.id === call.id ? { ...c, notificationId } : c)))
    }

    return notificationId
  }

  // Cancel a notification for a call
  const cancelCallNotification = async (callId: string) => {
    const { cancelAllNotificationsForCall } = require("../services/NotificationService")

    // Cancel all notifications for this call
    await cancelAllNotificationsForCall(callId)
  }

  // Add a new call
  const addCall = async (call: Call) => {
    setScheduledCalls((prevCalls) => [...prevCalls, call])
    await scheduleCallNotification(call)
  }

  // Remove a call
  const removeCall = async (id: string) => {
    setScheduledCalls((prevCalls) => prevCalls.filter((call) => call.id !== id))
    await cancelCallNotification(id)
  }

  // Add this useEffect for checking upcoming calls
  useEffect(() => {
    // Function to check for upcoming calls
    const checkUpcomingCalls = () => {
      const now = new Date()

      // Find calls that are due now (within the last minute)
      const dueCalls = scheduledCalls.filter((call) => {
        const callTime = new Date(call.date)
        const diffMs = Math.abs(callTime.getTime() - now.getTime())
        const diffMinutes = Math.floor(diffMs / 60000)

        // Call is due if it's within 1 minute of current time
        return diffMinutes <= 1 && callTime <= now
      })

      // Show notification for the first due call
      if (dueCalls.length > 0 && !isNotificationVisible) {
        const call = dueCalls[0]
        setActiveCallNotification(call)
        setIsNotificationVisible(true)
      }
    }

    // Check for upcoming calls every 15 seconds
    checkCallsIntervalRef.current = setInterval(checkUpcomingCalls, 15000)

    // Initial check
    checkUpcomingCalls()

    return () => {
      if (checkCallsIntervalRef.current) {
        clearInterval(checkCallsIntervalRef.current)
      }
    }
  }, [scheduledCalls, isNotificationVisible])

  // Add these handler functions
  const handleCloseNotification = () => {
    setIsNotificationVisible(false)
    setActiveCallNotification(null)
  }

  const handleCallNow = () => {
    if (activeCallNotification) {
      // Remove the call from scheduled calls
      removeCall(activeCallNotification.id)
    }
    setIsNotificationVisible(false)
    setActiveCallNotification(null)
  }

  // Update the return statement to include the CallNotification component
  return (
    <CallContext.Provider value={{ scheduledCalls, addCall, removeCall }}>
      {children}
      {isNotificationVisible && activeCallNotification && (
        <CallNotification
          visible={isNotificationVisible}
          contactName={activeCallNotification.contactName}
          phoneNumber={activeCallNotification.contactPhone}
          title={activeCallNotification.title}
          onClose={handleCloseNotification}
          onCallNow={handleCallNow}
        />
      )}
    </CallContext.Provider>
  )
}
