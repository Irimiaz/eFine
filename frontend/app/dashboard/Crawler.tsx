import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import * as Clipboard from "expo-clipboard";
import { useCreateBuilders } from "../../hooks/useCreateBuilders";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";

type DocumentData = {
  site_root: string;
  page_found_on: string;
  title: string;
  url: string;
  type: string;
  year: number | null;
};

type ScrapedData = {
  status: "success" | "error";
  site?: string;
  pages_crawled?: number;
  documents_found?: number;
  data?: DocumentData[];
  error?: string;
};

// Hardcoded ministry URLs for scraping
const MINISTRY_URLS = [
  {
    id: 1,
    name: "Ministerul Finantelor",
    url: "https://mfinante.gov.ro/ro/despre-minister",
    icon: "cash-outline" as const,
  },
  {
    id: 2,
    name: "Ministerul Sanatatii",
    url: "https://ms.ro/ro",
    icon: "medkit-outline" as const,
  },
  {
    id: 3,
    name: "Ministerul Educatiei",
    url: "https://www.edu.ro",
    icon: "school-outline" as const,
  },
];

export default function Crawler() {
  const { goBack } = useStackNavigation<MainStackParamList>();
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { crawlerBuilder } = useCreateBuilders();

  const handleCopyUrl = async (ministry: (typeof MINISTRY_URLS)[0]) => {
    await Clipboard.setStringAsync(ministry.url);
    setCopiedId(ministry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScrapeUrl = async (url: string) => {
    if (!url.trim()) {
      Alert.alert("Eroare", "Te rog sa introduci un URL valid");
      return;
    }

    setLoading(true);
    setScrapedData(null);

    try {
      crawlerBuilder.addParam("url", url);
      const response = await crawlerBuilder.send();
      console.log("Raw response:", JSON.stringify(response, null, 2)); // Add this line

      setScrapedData(response);
    } catch (error) {
      console.error("Error scraping URL:", error);
      setScrapedData({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "A aparut o eroare neasteptata la procesarea cererii",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Eroare", "Nu s-a putut deschide documentul");
    });
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`w-3/5 self-center flex-1`}>
        {/* Header */}
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
              <Text style={tw`text-2xl font-bold text-gray-900`}>
                PAP Scraper
              </Text>
              <Text style={tw`text-sm text-gray-500 mt-1`}>
                Colectare Planuri Achizitii Publice
              </Text>
            </View>
            {scrapedData && (
              <TouchableOpacity
                onPress={() => setScrapedData(null)}
                style={tw`bg-gray-600 px-4 py-2 rounded-lg flex-row items-center gap-2`}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={tw`text-white font-semibold`}>Sterge</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <View style={tw`p-4`}>
            {/* URL List */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                Site-uri Exemple ({MINISTRY_URLS.length})
              </Text>

              {MINISTRY_URLS.map((ministry) => (
                <View
                  key={ministry.id}
                  style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200`}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`bg-blue-100 p-3 rounded-lg mr-4`}>
                      <Ionicons
                        name={ministry.icon}
                        size={24}
                        color="#2563EB"
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-base font-semibold text-gray-900 mb-1`}
                      >
                        {ministry.name}
                      </Text>
                      <Text style={tw`text-xs text-gray-500`} numberOfLines={1}>
                        {ministry.url}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCopyUrl(ministry)}
                      style={tw`bg-gray-100 p-2 rounded-lg`}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <Ionicons
                        name={
                          copiedId === ministry.id
                            ? "checkmark"
                            : "copy-outline"
                        }
                        size={20}
                        color={copiedId === ministry.id ? "#10B981" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                Introdu URL Custom
              </Text>
              <View
                style={tw`bg-white rounded-xl p-4 shadow-sm border border-gray-200`}
              >
                <TextInput
                  style={tw`bg-gray-50 rounded-lg px-4 py-3 mb-3 text-gray-900 border border-gray-200`}
                  placeholder="https://exemplu.gov.ro"
                  placeholderTextColor="#9CA3AF"
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => handleScrapeUrl(customUrl)}
                  style={tw`bg-blue-600 py-3 rounded-lg flex-row items-center justify-center ${
                    loading || !customUrl.trim() ? "opacity-50" : ""
                  }`}
                  activeOpacity={0.7}
                  disabled={loading || !customUrl.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={tw`text-white font-semibold ml-2`}>Trimite</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loading Animation */}
            {loading && (
              <View style={tw`bg-white rounded-xl p-8 shadow-sm mb-6`}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={tw`text-center text-gray-600 mt-4 text-base`}>
                  Se colecteaza datele...
                </Text>
                <Text style={tw`text-center text-gray-400 mt-2 text-sm`}>
                  Acest proces poate dura cateva secunde
                </Text>
              </View>
            )}

            {scrapedData?.status === "error" && !loading && (
              <View
                style={tw`bg-red-50 rounded-xl p-4 border border-red-200 mb-6`}
              >
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="alert-circle" size={24} color="#DC2626" />
                  <Text style={tw`text-red-900 font-bold ml-2 text-base`}>
                    Eroare
                  </Text>
                </View>
                <Text style={tw`text-red-800 text-sm`}>
                  {scrapedData.error ||
                    "A aparut o eroare la procesarea cererii"}
                </Text>
              </View>
            )}

            {scrapedData?.status === "success" &&
              scrapedData?.documents_found === 0 &&
              !loading && (
                <View
                  style={tw`bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-6`}
                >
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color="#D97706"
                    />
                    <Text style={tw`text-yellow-900 font-bold ml-2 text-base`}>
                      Niciun rezultat
                    </Text>
                  </View>
                  <Text style={tw`text-yellow-800 text-sm`}>
                    Nu au fost gasite documente PAP pentru acest URL.
                  </Text>
                </View>
              )}

            {scrapedData?.status === "success" &&
              scrapedData.documents_found > 0 &&
              !loading && (
                <View
                  style={tw`bg-white rounded-xl shadow-sm border border-gray-200 mb-6`}
                >
                  {/* Results Header */}
                  <View style={tw`p-4 border-b border-gray-200`}>
                    <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>
                      Rezultate PAP
                    </Text>
                    <Text style={tw`text-sm text-gray-600 mb-3`}>
                      Site: {scrapedData.site}
                    </Text>
                    <View style={tw`flex-row gap-2`}>
                      <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}>
                        <Text style={tw`text-xs font-medium text-gray-700`}>
                          {scrapedData.pages_crawled} pagini scanate
                        </Text>
                      </View>
                      <View style={tw`bg-blue-100 px-3 py-1 rounded-full`}>
                        <Text style={tw`text-xs font-medium text-blue-700`}>
                          {scrapedData.documents_found} documente gasite
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Documents List */}
                  <View style={tw`p-4`}>
                    {scrapedData.data.map((doc, index) => (
                      <View
                        key={index}
                        style={tw`bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200`}
                      >
                        {/* Document number and type */}
                        <View
                          style={tw`flex-row items-center justify-between mb-2`}
                        >
                          <View style={tw`flex-row items-center`}>
                            <Text
                              style={tw`text-xs font-bold text-gray-500 mr-2`}
                            >
                              #{index + 1}
                            </Text>
                            <View
                              style={tw`bg-white px-2 py-1 rounded border border-gray-300`}
                            >
                              <Text
                                style={tw`text-xs font-semibold text-gray-700 uppercase`}
                              >
                                {doc.type}
                              </Text>
                            </View>
                          </View>
                          {doc.year && (
                            <View style={tw`bg-blue-100 px-2 py-1 rounded`}>
                              <Text
                                style={tw`text-xs font-semibold text-blue-700`}
                              >
                                {doc.year}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Document title */}
                        <Text
                          style={tw`text-sm font-semibold text-gray-900 mb-2`}
                        >
                          {doc.title}
                        </Text>

                        {/* Page found on */}
                        <Text
                          style={tw`text-xs text-gray-500 mb-3`}
                          numberOfLines={1}
                        >
                          Gasit pe: {doc.page_found_on}
                        </Text>

                        {/* Open document button */}
                        <TouchableOpacity
                          onPress={() => handleOpenDocument(doc.url)}
                          style={tw`bg-blue-600 py-2 rounded-lg flex-row items-center justify-center`}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="open-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text
                            style={tw`text-white font-semibold text-sm ml-2`}
                          >
                            Deschide Document
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
