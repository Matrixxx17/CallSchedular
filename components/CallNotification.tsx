"\"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Vibration } from "react-native"
import { makePhoneCall } from "../services/NotificationService"

interface CallNotificationProps {
  visible: boolean
  contactName: string
  phoneNumber: string
  title: string
  onClose: () => void
  onCallNow: () => void
}

const CallNotification = ({ visible, contactName, phoneNumber, title, onClose, onCallNow }: CallNotificationProps) => {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)

    // Vibrate when notification appears
    if (visible) {
      Vibration.vibrate([0, 500, 200, 500])
    }

    // Auto-dismiss after 30 seconds if no action is taken
    let timeout: NodeJS.Timeout
    if (visible) {
      timeout = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 30000)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [visible, onClose])

  const handleCallNow = () => {
    makePhoneCall(phoneNumber)
    setIsVisible(false)
    onCallNow()
  }

  const handleCancel = () => {
    setIsVisible(false)
    onClose()
  }

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Call Reminder</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>Do you want to call {contactName} now?</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.callButton]} onPress={handleCallNow}>
              <Text style={styles.callButtonText}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    backgroundColor: "#e74c3c",
    padding: 15,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  cancelButton: {
    borderRightWidth: 0.5,
    borderRightColor: "#eee",
  },
  callButton: {
    borderLeftWidth: 0.5,
    borderLeftColor: "#eee",
    backgroundColor: "#f8f8f8",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  callButtonText: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 16,
  },
})

export default CallNotification

