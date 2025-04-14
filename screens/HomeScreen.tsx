"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, Platform } from "react-native"
import { Calendar } from "react-native-calendars"
import { Ionicons, Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { CallContext } from "../context/CallContext"
import { format } from "date-fns"

export default function HomeScreen() {
  const navigation = useNavigation()
  const { scheduledCalls } = useContext(CallContext)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "MMM yyyy"))
  const [markedDates, setMarkedDates] = useState({})

  useEffect(() => {
    // Mark dates that have scheduled calls
    const marked = {}
    scheduledCalls.forEach((call) => {
      const dateStr = format(new Date(call.date), "yyyy-MM-dd")
      marked[dateStr] = {
        selected: true,
        selectedColor: "#e74c3c",
      }
    })
    setMarkedDates(marked)
  }, [scheduledCalls])

  // Filter calls for the selected date
  const filteredCalls = scheduledCalls.filter((call) => {
    return format(new Date(call.date), "yyyy-MM-dd") === selectedDate
  })

  const onMonthChange = (month) => {
    setCurrentMonth(format(new Date(month.dateString), "MMM yyyy"))
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.monthSelector}>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <Feather name="chevron-down" size={20} color="black" />
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Feather name="calendar" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        style={styles.calendar}
        theme={{
          calendarBackground: "#fae5d3",
          textSectionTitleColor: "#666",
          selectedDayBackgroundColor: "#e74c3c",
          selectedDayTextColor: "#fff",
          todayTextColor: "#e74c3c",
          dayTextColor: "#333",
          textDisabledColor: "#aaa",
          dotColor: "#e74c3c",
          selectedDotColor: "#fff",
          arrowColor: "#e74c3c",
          monthTextColor: "#333",
          indicatorColor: "#e74c3c",
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "500",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            selected: true,
            selectedColor: "#e74c3c",
          },
        }}
        onMonthChange={onMonthChange}
        enableSwipeMonths={true}
      />

      {/* Upcoming Calls */}
      <View style={styles.upcomingContainer}>
        <Text style={styles.upcomingTitle}>Upcoming</Text>

        {filteredCalls.length > 0 ? (
          <FlatList
            data={filteredCalls}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.callItem}>
                <View style={styles.dateIndicator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateDay}>{format(new Date(item.date), "dd")}</Text>
                  <Text style={styles.dateMonth}>{format(new Date(item.date), "MMM").toUpperCase()}</Text>
                </View>
                <View style={styles.callDetails}>
                  <Text style={styles.callTitle}>{item.title}</Text>
                  <Text style={styles.callTime}>
                    {format(new Date(item.date), "dd MMM")} - {format(new Date(item.date), "HH:mm")}
                  </Text>
                  <Text style={styles.callContact}>{item.contactName}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            )}
            style={styles.callsList}
          />
        ) : (
          <Text style={styles.noCallsText}>No calls scheduled for this date</Text>
        )}
      </View>

      {/* Add Call Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddCall")}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  menuButton: {
    padding: 8,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 4,
  },
  calendarButton: {
    padding: 8,
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 16,
    marginTop: 8,
  },
  upcomingContainer: {
    flex: 1,
    padding: 16,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  callsList: {
    flex: 1,
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateIndicator: {
    alignItems: "center",
    marginRight: 16,
  },
  dateLine: {
    position: "absolute",
    left: -8,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#e74c3c",
    borderRadius: 2,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  dateMonth: {
    fontSize: 14,
    color: "#e74c3c",
    textTransform: "uppercase",
  },
  callDetails: {
    flex: 1,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 4,
  },
  callTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  callContact: {
    fontSize: 14,
    color: "#999",
  },
  noCallsText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#e74c3c",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
})
