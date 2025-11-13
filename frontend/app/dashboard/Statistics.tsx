import React, { useState, useEffect } from "react";
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
import { MainStackParamList } from "../../types/navigation";
import { getDataFromCollection } from "../../api/databaseClient";
import { generateStatisticsPDF } from "../../utils/formHelpers";

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

type Statistics = {
  totalSubmissions: number;
  totalRevenue: number;
  averageFine: number;
  earlyPayments: number; // with discount
  latePayments: number; // with penalty
  onTimePayments: number; // no discount, no penalty
  lowFines: number; // < 200 RON
  mediumFines: number; // 200-500 RON
  highFines: number; // > 500 RON
  earlyPaymentPercentage: number;
  latePaymentPercentage: number;
  lowFinePercentage: number;
  mediumFinePercentage: number;
  highFinePercentage: number;
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
        setError("Nu s-au putut încărca datele.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Eroare la încărcarea datelor.");
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
    };

    setStats(statistics);
  };

  const handleDownloadPDF = async () => {
    if (!stats || data.length === 0) {
      setError("Nu există date pentru generarea raportului.");
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
    return (
      <View style={tw`mb-4`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={tw`text-gray-700 flex-1`}>{label}</Text>
          <Text style={tw`font-semibold text-gray-900`}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
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
      </View>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={tw`mt-4 text-gray-600`}>Se încarcă datele...</Text>
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
              Analiză și rapoarte
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
                Nu există date disponibile pentru analiză.
              </Text>
              <TouchableOpacity
                onPress={fetchData}
                style={tw`mt-4 bg-blue-600 px-6 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-semibold`}>Reîncarcă</Text>
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
                  <Text style={tw`text-sm text-gray-600`}>Total Formulare</Text>
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
                  <Text style={tw`text-sm text-gray-600`}>Total Încasat</Text>
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
                  <Text style={tw`text-sm text-gray-600`}>Medie/Formular</Text>
                </View>
              </View>

              {/* Analysis 1: Payment Timing */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Analiză 1: Timpul de Plată
                </Text>
                <Text style={tw`text-sm text-gray-600 mb-4`}>
                  Analiza evidențiază proporția plăților efectuate în termen (cu
                  reducere), în termen standard (fără reducere sau penalizare)
                  și după termen (cu penalizare).
                </Text>

                <BarChart
                  label="Plăți în Termen (cu Reducere)"
                  percentage={stats.earlyPaymentPercentage}
                  color="#059669"
                />
                <BarChart
                  label="Plăți Standard (fără Reducere/Penalizare)"
                  percentage={
                    (stats.onTimePayments / stats.totalSubmissions) * 100
                  }
                  color="#6B7280"
                />
                <BarChart
                  label="Plăți După Termen (cu Penalizare)"
                  percentage={stats.latePaymentPercentage}
                  color="#DC2626"
                />

                <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
                  <Text style={tw`text-sm text-gray-700`}>
                    <Text style={tw`font-semibold`}>Concluzie:</Text> Din
                    totalul de {stats.totalSubmissions} formulare,{" "}
                    {stats.earlyPayments} (
                    {stats.earlyPaymentPercentage.toFixed(1)}%) au fost plătite
                    în termen și au beneficiat de reducere, în timp ce{" "}
                    {stats.latePayments} (
                    {stats.latePaymentPercentage.toFixed(1)}%) au fost plătite
                    după termen și au primit penalizare.
                  </Text>
                </View>
              </View>

              {/* Analysis 2: Fine Amount Distribution */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Analiză 2: Distribuția Sumei Amenzilor
                </Text>
                <Text style={tw`text-sm text-gray-600 mb-4`}>
                  Analiza evidențiază distribuția amenzilor în funcție de
                  valoarea acestora: amenzi mici (sub 200 RON), amenzi medii
                  (200-500 RON) și amenzi mari (peste 500 RON).
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

                <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
                  <Text style={tw`text-sm text-gray-700`}>
                    <Text style={tw`font-semibold`}>Concluzie:</Text> Din
                    totalul de {stats.totalSubmissions} formulare,{" "}
                    {stats.lowFines} ({stats.lowFinePercentage.toFixed(1)}%)
                    sunt amenzi mici,
                    {stats.mediumFines} ({stats.mediumFinePercentage.toFixed(1)}
                    %) sunt amenzi medii, și {stats.highFines} (
                    {stats.highFinePercentage.toFixed(1)}%) sunt amenzi mari.
                  </Text>
                </View>
              </View>

              {/* Summary Table */}
              <View style={tw`bg-white rounded-xl p-5 shadow-sm mb-4`}>
                <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>
                  Rezumat Detaliat
                </Text>
                <View style={tw`gap-3`}>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>Total Formulare</Text>
                    <Text style={tw`font-semibold text-gray-900`}>
                      {stats.totalSubmissions}
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>Total Încasat</Text>
                    <Text style={tw`font-semibold text-gray-900`}>
                      {stats.totalRevenue.toFixed(2)} RON
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>Medie Sumă/Formular</Text>
                    <Text style={tw`font-semibold text-gray-900`}>
                      {stats.averageFine.toFixed(2)} RON
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>Plăți în Termen</Text>
                    <Text style={tw`font-semibold text-green-600`}>
                      {stats.earlyPayments} (
                      {stats.earlyPaymentPercentage.toFixed(1)}%)
                    </Text>
                  </View>
                  <View
                    style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                  >
                    <Text style={tw`text-gray-700`}>Plăți După Termen</Text>
                    <Text style={tw`font-semibold text-red-600`}>
                      {stats.latePayments} (
                      {stats.latePaymentPercentage.toFixed(1)}%)
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
