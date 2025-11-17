import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import { getDataFromCollection } from "../../api/databaseClient";
import { generateStatisticsPDF } from "../../utils/formHelpers";
import {
  BarChart as GiftedBarChart,
  LineChart as GiftedLineChart,
} from "react-native-gifted-charts";

type FormData = {
  nume: string;
  prenume: string;
  cnp: string;
  email: string;
  telefon: string;
  adresa: string;
  numarProcesVerbal: string;
  dataContraventie: string;
  autoritateEmitenta: string;
  descriereContraventie: string;
  sumaAmenda: number;
  procentReducere: number;
  sumaReducere: number;
  subtotal: number;
  procentPenalizare: number;
  sumaPenalizare: number;
  totalDePlata: number;
  submissionTime?: string;
  submissionDate?: string;
  submissionTimeFormatted?: string;
};

type DailyPayment = {
  date: string;
  count: number;
  total: number;
};

type AuthorityStats = {
  name: string;
  count: number;
  totalRevenue: number;
  percentage: number;
};

type Statistics = {
  totalSubmissions: number;
  totalRevenue: number;
  averageFine: number;
  earlyPayments: number;
  latePayments: number;
  onTimePayments: number;
  lowFines: number;
  mediumFines: number;
  highFines: number;
  earlyPaymentPercentage: number;
  latePaymentPercentage: number;
  lowFinePercentage: number;
  mediumFinePercentage: number;
  highFinePercentage: number;
  dailyPayments: DailyPayment[];
  authorityStats: AuthorityStats[];
  maxDailyPayments: number;
  totalDiscounts: number;
  totalPenalties: number;
  averageDiscount: number;
  averagePenalty: number;
};

export default function Statistics() {
  const { goBack } = useStackNavigation<MainStackParamList>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FormData[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDataFromCollection<FormData>("formInputs", {});

      if (response.status === "success" && response.data) {
        setData(response.data);
        calculateStatistics(response.data);
      } else {
        setError("Nu s-au putut incarca datele.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Eroare la incarcarea datelor.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (formData: FormData[]) => {
    if (formData.length === 0) {
      setStats({
        totalSubmissions: 0,
        totalRevenue: 0,
        averageFine: 0,
        earlyPayments: 0,
        latePayments: 0,
        onTimePayments: 0,
        lowFines: 0,
        mediumFines: 0,
        highFines: 0,
        earlyPaymentPercentage: 0,
        latePaymentPercentage: 0,
        lowFinePercentage: 0,
        mediumFinePercentage: 0,
        highFinePercentage: 0,
        dailyPayments: [],
        authorityStats: [],
        maxDailyPayments: 0,
        totalDiscounts: 0,
        totalPenalties: 0,
        averageDiscount: 0,
        averagePenalty: 0,
      });
      return;
    }

    const totalSubmissions = formData.length;
    const totalRevenue = formData.reduce(
      (sum, item) => sum + (item.totalDePlata || 0),
      0
    );
    const averageFine = totalRevenue / totalSubmissions;

    // Payment timing analysis
    const earlyPayments = formData.filter(
      (item) => (item.procentReducere || 0) > 0
    ).length;
    const latePayments = formData.filter(
      (item) => (item.procentPenalizare || 0) > 0
    ).length;
    const onTimePayments = formData.filter(
      (item) =>
        (item.procentReducere || 0) === 0 && (item.procentPenalizare || 0) === 0
    ).length;

    // Fine amount distribution
    const lowFines = formData.filter(
      (item) => (item.sumaAmenda || 0) < 200
    ).length;
    const mediumFines = formData.filter(
      (item) => (item.sumaAmenda || 0) >= 200 && (item.sumaAmenda || 0) <= 500
    ).length;
    const highFines = formData.filter(
      (item) => (item.sumaAmenda || 0) > 500
    ).length;

    // Daily payments for last 30 days
    const dailyPaymentsMap = new Map<
      string,
      { count: number; total: number }
    >();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    formData.forEach((item) => {
      if (item.submissionTime) {
        const submissionDate = new Date(item.submissionTime);
        if (submissionDate >= thirtyDaysAgo) {
          const dateKey = submissionDate.toISOString().split("T")[0];
          const existing = dailyPaymentsMap.get(dateKey) || {
            count: 0,
            total: 0,
          };
          dailyPaymentsMap.set(dateKey, {
            count: existing.count + 1,
            total: existing.total + (item.totalDePlata || 0),
          });
        }
      }
    });

    // Fill in missing days with 0
    const dailyPayments: DailyPayment[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const dayData = dailyPaymentsMap.get(dateKey) || { count: 0, total: 0 };
      dailyPayments.push({
        date: dateKey,
        count: dayData.count,
        total: dayData.total,
      });
    }

    const maxDailyPayments = Math.max(...dailyPayments.map((d) => d.count), 1);

    // Authority statistics
    const authorityMap = new Map<
      string,
      { count: number; totalRevenue: number }
    >();
    formData.forEach((item) => {
      const auth = item.autoritateEmitenta || "Necunoscuta";
      const existing = authorityMap.get(auth) || { count: 0, totalRevenue: 0 };
      authorityMap.set(auth, {
        count: existing.count + 1,
        totalRevenue: existing.totalRevenue + (item.totalDePlata || 0),
      });
    });

    const authorityStats: AuthorityStats[] = Array.from(authorityMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalRevenue: data.totalRevenue,
        percentage: (data.count / totalSubmissions) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 authorities

    // Discount and penalty totals
    const totalDiscounts = formData.reduce(
      (sum, item) => sum + (item.sumaReducere || 0),
      0
    );
    const totalPenalties = formData.reduce(
      (sum, item) => sum + (item.sumaPenalizare || 0),
      0
    );
    const averageDiscount =
      earlyPayments > 0 ? totalDiscounts / earlyPayments : 0;
    const averagePenalty = latePayments > 0 ? totalPenalties / latePayments : 0;

    const statistics: Statistics = {
      totalSubmissions,
      totalRevenue,
      averageFine,
      earlyPayments,
      latePayments,
      onTimePayments,
      lowFines,
      mediumFines,
      highFines,
      earlyPaymentPercentage: (earlyPayments / totalSubmissions) * 100,
      latePaymentPercentage: (latePayments / totalSubmissions) * 100,
      lowFinePercentage: (lowFines / totalSubmissions) * 100,
      mediumFinePercentage: (mediumFines / totalSubmissions) * 100,
      highFinePercentage: (highFines / totalSubmissions) * 100,
      dailyPayments,
      authorityStats,
      maxDailyPayments,
      totalDiscounts,
      totalPenalties,
      averageDiscount,
      averagePenalty,
    };

    setStats(statistics);
  };

  const handleDownloadPDF = async () => {
    if (!stats || data.length === 0) {
      setError("Nu exista date pentru generarea raportului.");
      return;
    }

    try {
      await generateStatisticsPDF(stats, data);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Nu s-a putut genera PDF-ul raportului.");
    }
  };

  const BarChart = ({
    label,
    percentage,
    color,
  }: {
    label: string;
    percentage: number;
    color: string;
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <View style={tw`mb-4`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={tw`text-gray-700 flex-1`}>{label}</Text>
          <Text style={tw`font-semibold text-gray-900`}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
        <TouchableOpacity
          onPressIn={() => setShowTooltip(true)}
          onPressOut={() => setShowTooltip(false)}
          activeOpacity={1}
        >
          <View style={tw`relative`}>
            <View style={tw`h-6 bg-gray-200 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            {showTooltip && (
              <View style={tw`absolute -top-8 left-0 right-0 items-center`}>
                <View style={tw`bg-gray-900 px-3 py-1 rounded-lg shadow-md`}>
                  <Text style={tw`text-white text-xs font-semibold`}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const LineChart = ({
    data,
    maxValue,
    label,
  }: {
    data: DailyPayment[];
    maxValue: number;
    label: string;
  }) => {
    const screenWidth = Dimensions.get("window").width;
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Prepare data for the chart
    const chartData = data.map((day, index) => {
      const date = new Date(day.date);
      return {
        value: day.count,
        label: date.getDate().toString(),
        labelTextStyle: { color: "#6B7280", fontSize: 10 },
        onPress: () => {
          setSelectedIndex(selectedIndex === index ? null : index);
        },
      };
    });

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const selectedDay = selectedIndex !== null ? data[selectedIndex] : null;

    return (
      <View style={tw`mb-4`}>
        <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
          {label}
        </Text>
        <View style={tw`bg-gray-50 rounded-lg p-4 border border-gray-200`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw`relative`}>
              <GiftedLineChart
                data={chartData}
                width={Math.max(screenWidth - 80, data.length * 20)}
                height={220}
                color="#2563EB"
                thickness={2}
                spacing={Math.max((screenWidth - 80) / data.length, 20)}
                curved
                areaChart
                startFillColor="#2563EB"
                endFillColor="#EFF6FF"
                startOpacity={0.4}
                endOpacity={0.1}
                hideDataPoints={false}
                dataPointsColor="#2563EB"
                dataPointsRadius={4}
                textShiftY={-10}
                textShiftX={-5}
                textFontSize={10}
                yAxisColor="#9CA3AF"
                xAxisColor="#9CA3AF"
                rulesColor="#E5E7EB"
                yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
                hideRules={false}
                initialSpacing={10}
                showValuesAsDataPointsText
              />
              {selectedDay && selectedIndex !== null && (
                <View
                  style={tw`absolute top-2 left-2 bg-gray-900 px-3 py-2 rounded-lg shadow-lg z-10`}
                >
                  <Text style={tw`text-white text-xs font-semibold mb-1`}>
                    {new Date(selectedDay.date).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                  <Text style={tw`text-white text-xs`}>
                    Plati: {selectedDay.count}
                  </Text>
                  <Text style={tw`text-white text-xs`}>
                    Total: {selectedDay.total.toFixed(2)} RON
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
          <Text style={tw`text-xs text-gray-500 mt-2 text-center`}>
            Ultimele 30 zile
          </Text>
        </View>
      </View>
    );
  };

  const PieChartRepresentation = ({
    data,
    label,
  }: {
    data: AuthorityStats[];
    label: string;
  }) => {
    const colors = ["#2563EB", "#059669", "#7C3AED", "#DC2626", "#F59E0B"];

    return (
      <View style={tw`mb-4`}>
        <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>
          {label}
        </Text>
        <View style={tw`flex-row flex-wrap gap-3`}>
          {data.map((item, index) => (
            <View key={index} style={tw`flex-row items-center mb-2`}>
              <View
                style={[
                  tw`w-4 h-4 rounded-full mr-2`,
                  { backgroundColor: colors[index % colors.length] },
                ]}
              />
              <Text style={tw`text-sm text-gray-700 flex-1`}>
                {item.name.length > 20
                  ? item.name.substring(0, 20) + "..."
                  : item.name}
              </Text>
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                {item.count} ({item.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={tw`mt-4 text-gray-600`}>Se incarca datele...</Text>
      </View>
    );
  }

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
              Analiza si rapoarte
            </Text>
          </View>
          {stats && data.length > 0 && (
            <TouchableOpacity
              onPress={handleDownloadPDF}
              style={tw`bg-blue-600 px-4 py-2 rounded-lg flex-row items-center gap-2`}
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={tw`text-white font-semibold`}>PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <View style={tw`p-4`}>
          {error && (
            <View
              style={tw`bg-red-50 border border-red-200 rounded-lg p-4 mb-4`}
            >
              <Text style={tw`text-red-600`}>{error}</Text>
            </View>
          )}

          {!stats || data.length === 0 ? (
            <View style={tw`bg-white rounded-xl p-8 items-center`}>
              <Ionicons name="stats-chart-outline" size={64} color="#9CA3AF" />
              <Text style={tw`text-gray-500 mt-4 text-center`}>
                Nu exista date disponibile pentru analiza.
              </Text>
              <TouchableOpacity
                onPress={fetchData}
                style={tw`mt-4 bg-blue-600 px-6 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-semibold`}>Reincarca</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Stats Cards */}
              <View style={tw`flex-row flex-wrap gap-4 mb-6`}>
                <View
                  style={tw`bg-white rounded-xl p-5 shadow-sm flex-1 min-w-[150px]`}
                >
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Ionicons name="document-text" size={24} color="#2563EB" />
                    <Text style={tw`text-2xl font-bold text-gray-900`}>
                      {stats.totalSubmissions}
                    </Text>
                  </View>
                  <Text style={tw`text-sm text-gray-600`}>
                    Numar de amenzi platite
                  </Text>
                </View>

                <View
                  style={tw`bg-white rounded-xl p-5 shadow-sm flex-1 min-w-[150px]`}
                >
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Ionicons name="cash" size={24} color="#059669" />
                    <Text style={tw`text-2xl font-bold text-gray-900`}>
                      {stats.totalRevenue.toFixed(2)} RON
                    </Text>
                  </View>
                  <Text style={tw`text-sm text-gray-600`}>
                    Total suma platita
                  </Text>
                </View>

                <View
                  style={tw`bg-white rounded-xl p-5 shadow-sm flex-1 min-w-[150px]`}
                >
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Ionicons name="calculator" size={24} color="#7C3AED" />
                    <Text style={tw`text-2xl font-bold text-gray-900`}>
                      {stats.averageFine.toFixed(2)} RON
                    </Text>
                  </View>
                  <Text style={tw`text-sm text-gray-600`}>
                    Medie suma platita/Amenda
                  </Text>
                </View>
              </View>

              {/* Analysis 1: Payment Timing */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Timpul de Plata
                </Text>

                <BarChart
                  label="Plati in Termen (cu Reducere)"
                  percentage={stats.earlyPaymentPercentage}
                  color="#059669"
                />
                <BarChart
                  label="Plati Standard (fara Reducere/Penalizare)"
                  percentage={
                    (stats.onTimePayments / stats.totalSubmissions) * 100
                  }
                  color="#6B7280"
                />
                <BarChart
                  label="Plati Dupa Termen (cu Penalizare)"
                  percentage={stats.latePaymentPercentage}
                  color="#DC2626"
                />
              </View>

              {/* Analysis 2: Fine Amount Distribution */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Distributia Sumei Amenzilor
                </Text>

                <BarChart
                  label="Amenzi Mici (< 200 RON)"
                  percentage={stats.lowFinePercentage}
                  color="#3B82F6"
                />
                <BarChart
                  label="Amenzi Medii (200-500 RON)"
                  percentage={stats.mediumFinePercentage}
                  color="#8B5CF6"
                />
                <BarChart
                  label="Amenzi Mari (> 500 RON)"
                  percentage={stats.highFinePercentage}
                  color="#EF4444"
                />
              </View>

              {/* Analysis 3: Daily Payments (Line Chart) */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Plata Zilnica (Ultimele 30 Zile)
                </Text>

                <LineChart
                  data={stats.dailyPayments}
                  maxValue={stats.maxDailyPayments}
                  label=""
                />
              </View>

              {/* Additional Statistics */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Statistici Suplimentare
                </Text>
                <View style={tw`gap-3`}>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>
                      Total Reduceri Acordate
                    </Text>
                    <Text style={tw`font-semibold text-green-600`}>
                      {stats.totalDiscounts.toFixed(2)} RON
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>Medie Reducere/Plata</Text>
                    <Text style={tw`font-semibold text-gray-900`}>
                      {stats.averageDiscount.toFixed(2)} RON
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>
                      Total Penalizari Aplicate
                    </Text>
                    <Text style={tw`font-semibold text-red-600`}>
                      {stats.totalPenalties.toFixed(2)} RON
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>
                      Medie Penalizare/Plata
                    </Text>
                    <Text style={tw`font-semibold text-gray-900`}>
                      {stats.averagePenalty.toFixed(2)} RON
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
