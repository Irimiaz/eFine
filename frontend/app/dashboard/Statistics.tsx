import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";

export default function Statistics() {
  const { goBack } = useStackNavigation<MainStackParamList>();

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header with Back Button */}
      <View style={tw`bg-white shadow-sm border-b border-gray-200`}>
        <View style={tw`flex-row items-center px-4 py-4`}>
          <TouchableOpacity
            onPress={goBack}
            style={tw`mr-4 p-2 -ml-2`}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Statistici</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>
              Analiză și rapoarte
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <View style={tw`p-4`}>
          {/* Stats Cards */}
          <View style={tw`flex-row flex-wrap gap-4 mb-6`}>
            {/* Total Submissions Card */}
            <View
              style={tw`bg-white rounded-xl p-5 shadow-sm flex-1 min-w-[150px]`}
            >
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <Ionicons name="document-text" size={24} color="#2563EB" />
                <Text style={tw`text-2xl font-bold text-gray-900`}>0</Text>
              </View>
              <Text style={tw`text-sm text-gray-600`}>Total Formulare</Text>
            </View>

            {/* Total Amount Card */}
            <View
              style={tw`bg-white rounded-xl p-5 shadow-sm flex-1 min-w-[150px]`}
            >
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <Ionicons name="cash" size={24} color="#059669" />
                <Text style={tw`text-2xl font-bold text-gray-900`}>0 RON</Text>
              </View>
              <Text style={tw`text-sm text-gray-600`}>Total Încasat</Text>
            </View>
          </View>

          {/* Charts Section */}
          <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
            <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
              Grafic Statistici
            </Text>
            <View
              style={tw`h-48 bg-gray-100 rounded-lg items-center justify-center`}
            >
              <Ionicons name="bar-chart" size={48} color="#9CA3AF" />
              <Text style={tw`text-gray-500 mt-2`}>
                Graficul va fi afișat aici
              </Text>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
            <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
              Activitate Recentă
            </Text>
            <View style={tw`items-center py-8`}>
              <Ionicons name="time-outline" size={48} color="#9CA3AF" />
              <Text style={tw`text-gray-500 mt-2 text-center`}>
                Nu există activitate recentă
              </Text>
            </View>
          </View>

          {/* Summary Table */}
          <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
            <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
              Rezumat
            </Text>
            <View style={tw`gap-3`}>
              <View
                style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
              >
                <Text style={tw`text-gray-700`}>Formulare Salvate</Text>
                <Text style={tw`font-semibold text-gray-900`}>0</Text>
              </View>
              <View
                style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
              >
                <Text style={tw`text-gray-700`}>PDF-uri Generate</Text>
                <Text style={tw`font-semibold text-gray-900`}>0</Text>
              </View>
              <View
                style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
              >
                <Text style={tw`text-gray-700`}>XML-uri Generate</Text>
                <Text style={tw`font-semibold text-gray-900`}>0</Text>
              </View>
              <View style={tw`flex-row justify-between items-center py-2`}>
                <Text style={tw`text-gray-700`}>Medie Sumă/Formular</Text>
                <Text style={tw`font-semibold text-gray-900`}>0 RON</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
