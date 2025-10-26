import React, { useState } from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import tw from "twrnc";
import BaseScreen from "../../components/BaseScreen";
import { setDataToCollection } from "../../api/databaseClient";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);

  const addFakeData = async () => {
    setLoading(true);
    try {
      const fakeData = {
        name: `User ${Math.floor(Math.random() * 1000)}`,
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        createdAt: new Date().toISOString(),
        data: {
          someField: "test value",
          randomNumber: Math.floor(Math.random() * 100),
        },
      };

      const response = await setDataToCollection("formInputs", fakeData);

      if (response.status === "success") {
        Alert.alert("Success", "Fake data added to database!");
        console.log("Inserted data:", response.data);
      } else {
        Alert.alert("Error", response.message || "Failed to add data");
      }
    } catch (error) {
      console.error("Error adding fake data:", error);
      Alert.alert("Error", "Failed to add fake data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseScreen>
      <View style={tw`flex-1 justify-center items-center gap-4`}>
        <Text style={tw`text-2xl font-bold mb-8`}>Hello World</Text>

        <TouchableOpacity
          onPress={addFakeData}
          disabled={loading}
          style={tw`bg-blue-500 px-6 py-3 rounded-lg ${
            loading ? "opacity-50" : ""
          }`}
        >
          <Text style={tw`text-white text-lg font-semibold`}>
            {loading ? "Adding..." : "Add Fake Data"}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
};

export default Dashboard;
