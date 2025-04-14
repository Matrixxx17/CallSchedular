import * as Notifications from "expo-notifications"
import * as Linking from "expo-linking"
import { Platform } from "react-native"

// Configure notifications with higher priority
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

export const initializeNotifications = async () => {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  })

  if (status !== "granted") {
    console.log("Notification permissions not granted")
    return false
  }

  // Set up notification categories with action buttons
  if (Platform.OS === "ios") {
    await Notifications.setNotificationCategoryAsync("CALL_REMINDER", [
      {
        identifier: "CALL_NOW",
        buttonTitle: "Call Now",
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: "CANCEL",
        buttonTitle: "Cancel",
        options: {
          isDestructive: true,
          isAuthenticationRequired: false,
        },
      },
    ])
  }

  return true
}

export const scheduleCallNotification = async (call) => {
  // Cancel any existing notifications for this call
  await cancelAllNotificationsForCall(call.id)

  // Calculate seconds until the call time
  const callTime = new Date(call.date)
  const now = new Date()

  // Ensure we're scheduling for a future time
  if (callTime <= now) {
    console.log("Cannot schedule notification for past time")
    return null
  }

  console.log(`Scheduling notification for: ${callTime.toLocaleString()}`)

  try {
    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Scheduled Call Reminder",
        body: `Do you want to call ${call.contactName} now? (${call.title})`,
        data: {
          callId: call.id,
          phoneNumber: call.contactPhone,
          title: call.title,
          contactName: call.contactName,
        },
        sound: true,
        priority: "max",
        categoryIdentifier: Platform.OS === "ios" ? "CALL_REMINDER" : undefined,
        // For Android, add action buttons directly
        ...(Platform.OS === "android" && {
          actions: [
            {
              identifier: "CALL_NOW",
              title: "Call Now",
              icon: "ic_launcher",
            },
            {
              identifier: "CANCEL",
              title: "Cancel",
              icon: "ic_launcher",
            },
          ],
        }),
      },
      trigger: {
        date: callTime,
        channelId: "call-reminders",
      },
    })

    console.log(`Notification scheduled with ID: ${notificationId}`)
    return notificationId
  } catch (error) {
    console.error("Error scheduling notification:", error)
    return null
  }
}

export const cancelNotification = async (notificationId) => {
  if (!notificationId) return

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
    console.log(`Cancelled notification: ${notificationId}`)
  } catch (error) {
    console.error(`Error cancelling notification ${notificationId}:`, error)
  }
}

export const cancelAllNotificationsForCall = async (callId) => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()

    for (const notification of scheduledNotifications) {
      const data = notification.content.data
      if (data && data.callId === callId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier)
        console.log(`Cancelled existing notification for call ID: ${callId}`)
      }
    }
  } catch (error) {
    console.error("Error cancelling notifications for call:", error)
  }
}

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    console.log("Cancelled all notifications")
  } catch (error) {
    console.error("Error cancelling all notifications:", error)
  }
}

export const createNotificationChannels = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("call-reminders", {
      name: "Call Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: true,
    })
  }
}

export const setupNotificationListeners = (onNotificationResponse) => {
  // When app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification received in foreground:", notification)
  })

  // When user interacts with notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification response received:", response)

    const data = response.notification.request.content.data
    const actionId = response.actionIdentifier

    // Handle action button presses
    if (actionId === "CALL_NOW" || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      if (data.phoneNumber) {
        console.log(`Initiating call to: ${data.phoneNumber}`)
        Linking.openURL(`tel:${data.phoneNumber}`)
      }
    }

    // Call the callback if provided
    if (onNotificationResponse) {
      onNotificationResponse(response)
    }
  })

  // Return unsubscribe functions
  return () => {
    foregroundSubscription.remove()
    responseSubscription.remove()
  }
}

// Function to make a direct call
export const makePhoneCall = (phoneNumber) => {
  if (!phoneNumber) return false

  try {
    Linking.openURL(`tel:${phoneNumber}`)
    return true
  } catch (error) {
    console.error("Error making phone call:", error)
    return false
  }
}
