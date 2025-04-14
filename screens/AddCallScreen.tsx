"use client"

import { useState, useContext, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as Contacts from "expo-contacts"
import { CallContext } from "../context/CallContext"
import { useNavigation } from "@react-navigation/native"
import { format } from "date-fns"

export default function AddCallScreen() {
  const navigation = useNavigation()
  const { addCall } = useContext(CallContext)

  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showContacts, setShowContacts] = useState(false)
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    ;(async () => {
      const { status } = await Contacts.requestPermissionsAsync()
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        })

        if (data.length > 0) {
          // Filter contacts that have phone numbers
          const contactsWithPhones = data.filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          setContacts(contactsWithPhones)
        }
      }
    })()
  }, [])

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date
    setShowDatePicker(Platform.OS === "ios")
    setDate(currentDate)
  }

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || date
    setShowTimePicker(Platform.OS === "ios")
    setDate(currentTime)
  }

  const handleContactSelect = (contact) => {
    setSelectedContact(contact)
    setShowContacts(false)
  }

  // Update the handleScheduleCall function to ensure we're scheduling for a future time
  const handleScheduleCall = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for the call")
      return
    }

    if (!selectedContact) {
      Alert.alert("Error", "Please select a contact")
      return
    }

    // Check if the selected date is in the past
    const now = new Date()
    if (date <= now) {
      Alert.alert("Invalid Time", "The selected time has already passed. Please select a future time.", [
        { text: "OK" },
      ])
      return
    }

    const newCall = {
      id: Date.now().toString(),
      title,
      date: date.toISOString(),
      contactName: selectedContact.name,
      contactPhone: selectedContact.phoneNumbers[0].number,
    }

    addCall(newCall)

    // Schedule notification
    scheduleCallNotification(newCall)

    // Show confirmation
    Alert.alert("Call Scheduled", `Call to ${selectedContact.name} scheduled for ${format(date, "PPpp")}`, [
      { text: "OK" },
    ])

    navigation.goBack()
  }

  // Update the scheduleCallNotification function in AddCallScreen.tsx
  const scheduleCallNotification = async (call) => {
    // Import the notification service
    const { scheduleCallNotification } = require("../services/NotificationService")

    // Schedule the notification using the service
    await scheduleCallNotification(call)

    console.log(`Scheduled notification for call: ${call.title} at ${new Date(call.date).toLocaleString()}`)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter call title" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateTimeText}>{format(date, "MMMM dd, yyyy")}</Text>
          <MaterialIcons name="date-range" size={24} color="#e74c3c" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dateTimeText}>{format(date, "hh:mm a")}</Text>
          <MaterialIcons name="access-time" size={24} color="#e74c3c" />
        </TouchableOpacity>
        {showTimePicker && <DateTimePicker value={date} mode="time" display="default" onChange={onTimeChange} />}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact</Text>
        {selectedContact ? (
          <TouchableOpacity style={styles.contactButton} onPress={() => setShowContacts(true)}>
            <View style={styles.selectedContact}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>{selectedContact.name.charAt(0)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{selectedContact.name}</Text>
                <Text style={styles.contactPhone}>{selectedContact.phoneNumbers[0].number}</Text>
              </View>
            </View>
            <MaterialIcons name="edit" size={24} color="#e74c3c" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.selectContactButton} onPress={() => setShowContacts(true)}>
            <Text style={styles.selectContactText}>Select Contact</Text>
            <Ionicons name="person-add" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>

      {showContacts && (
        <View style={styles.contactsList}>
          <Text style={styles.contactsHeader}>Select a Contact</Text>
          {contacts.map((contact) => (
            <TouchableOpacity key={contact.id} style={styles.contactItem} onPress={() => handleContactSelect(contact)}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                  <Text style={styles.contactPhone}>{contact.phoneNumbers[0].number}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleCall}>
        <Text style={styles.scheduleButtonText}>Schedule Call</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateTimeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#333",
  },
  selectContactButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  selectContactText: {
    fontSize: 16,
    color: "#333",
  },
  contactButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  selectedContact: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactsList: {
    marginBottom: 20,
  },
  contactsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
  },
  scheduleButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  scheduleButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})
