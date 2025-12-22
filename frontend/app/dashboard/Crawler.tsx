import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import useStackNavigation from "../../hooks/useStackNavigation";
import type { MainStackParamList } from "../../types/navigation";
import { useCreateBuilders } from "../../hooks/useCreateBuilders";

type ScrapedData = {
  url: string;
  status: "success" | "error";
  data?: Array<{
    title: string;
    publicationDate: string;
    institution: string;
    value: string;
    description: string;
  }>;
  error?: string;
};

// Hardcoded ministry URLs for scraping
const MINISTRY_URLS = [
  {
    id: 1,
    name: "Ministerul Finantelor",
    url: "https://mfinante.gov.ro/ro/achizitii-publice",
    icon: "cash-outline" as const,
  },
  {
    id: 2,
    name: "Ministerul Sanatatii",
    url: "https://ms.ro/ro/achizitii/",
    icon: "medkit-outline" as const,
  },
  {
    id: 3,
    name: "Ministerul Educatiei",
    url: "https://www.edu.ro/achizitii-publice",
    icon: "school-outline" as const,
  },
  {
    id: 4,
    name: "Ministerul Transporturilor",
    url: "https://www.mt.ro/web14/transparenta-decizionala/achizitii-publice",
    icon: "car-outline" as const,
  },
  {
    id: 5,
    name: "Ministerul Muncii",
    url: "https://mmuncii.ro/j33/index.php/ro/transparenta/achizitii-publice",
    icon: "people-outline" as const,
  },
];

export default function Crawler() {
  const { goBack } = useStackNavigation<MainStackParamList>();
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<number | null>(null);
  const { crawlerBuilder } = useCreateBuilders();

  const handleScrapeUrl = async (ministry: (typeof MINISTRY_URLS)[0]) => {
    setLoading(true);

    try {
      crawlerBuilder.addParam("url", ministry.url);
      const response = await crawlerBuilder.send();
      setScrapedData(response);
    } catch (error) {
      console.error("Error scraping URL:", error);
    } finally {
      setLoading(false);
    }
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
            {scrapedData.length > 0 && (
              <TouchableOpacity
                onPress={() => setScrapedData([])}
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
                Site-uri Disponibile ({MINISTRY_URLS.length})
              </Text>

              {MINISTRY_URLS.map((ministry) => (
                <TouchableOpacity
                  key={ministry.id}
                  style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200`}
                  activeOpacity={0.7}
                  onPress={() => handleScrapeUrl(ministry)}
                  disabled={loading}
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
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                </TouchableOpacity>
              ))}
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
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
