import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc"; // <-- tailwind-in-RN (tw`...`)
import { generatePaymentOrderPDF, generateXML } from "../../utils/formHelpers";
import { setDataToCollection } from "../../api/databaseClient";
import { MainStackParamList } from "../../types/navigation";
import useStackNavigation from "../../hooks/useStackNavigation";

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, buttons);
  }
};

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

export default function FinePaymentForm() {
  const { goToScreen } = useStackNavigation<MainStackParamList>();

  // Personal Information
  const [nume, setNume] = useState("");
  const [prenume, setPrenume] = useState("");
  const [cnp, setCnp] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adresa, setAdresa] = useState("");

  // Fine Details
  const [numarProcesVerbal, setNumarProcesVerbal] = useState("");
  const [dataContraventie, setDataContraventie] = useState("");
  const [autoritateEmitenta, setAutoritateEmitenta] = useState("");
  const [descriereContraventie, setDescriereContraventie] = useState("");

  // Financial Calculations
  const [sumaAmenda, setSumaAmenda] = useState<string>("");
  const [procentReducere, setProcentReducere] = useState<string>("");
  const [sumaReducere, setSumaReducere] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [procentPenalizare, setProcentPenalizare] = useState<string>("");
  const [sumaPenalizare, setSumaPenalizare] = useState<number>(0);
  const [totalDePlata, setTotalDePlata] = useState<number>(0);

  // Validation / UI
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [daysSinceViolation, setDaysSinceViolation] = useState<number>(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // “Last saved” control
  const [lastSavedData, setLastSavedData] = useState<FormData | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [dirtySinceSave, setDirtySinceSave] = useState(false);

  // Utils
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const calculateDaysDifference = (
    violationDate: Date,
    currentDate: Date = new Date()
  ): number => {
    const timeDiff = currentDate.getTime() - violationDate.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  };

  const handleDateChange = (_event: any, picked?: Date) => {
    setShowDatePicker(false);
    if (picked) {
      setSelectedDate(picked);
      setDataContraventie(formatDate(picked));
    }
  };

  // Clear error on typing
  useEffect(() => {
    if (errorMessage) {
      setErrorMessage("");
      setIsFormValid(false);
    }
  }, [
    nume,
    prenume,
    cnp,
    email,
    adresa,
    numarProcesVerbal,
    dataContraventie,
    autoritateEmitenta,
    descriereContraventie,
    sumaAmenda,
  ]);

  // Auto-calculations
  useEffect(() => {
    const amenda = parseFloat(sumaAmenda) || 0;
    const violationDate = parseDate(dataContraventie);
    const currentDate = new Date();

    let daysDiff = 0;
    if (violationDate) {
      daysDiff = calculateDaysDifference(violationDate, currentDate);
      setDaysSinceViolation(daysDiff);
    } else {
      setDaysSinceViolation(0);
    }

    let autoDiscountPercent = 0;
    if (daysDiff >= 0 && daysDiff <= 15) autoDiscountPercent = 50;
    else if (daysDiff > 15 && daysDiff <= 30) autoDiscountPercent = 25;

    let autoPenaltyPercent = 0;
    if (daysDiff > 60) autoPenaltyPercent = 10;

    setProcentReducere(autoDiscountPercent.toString());
    setProcentPenalizare(autoPenaltyPercent.toString());

    const reducereAmount = (amenda * autoDiscountPercent) / 100;
    setSumaReducere(reducereAmount);

    const sub = amenda - reducereAmount;
    setSubtotal(sub);

    const penalizareAmount = (sub * autoPenaltyPercent) / 100;
    setSumaPenalizare(penalizareAmount);

    setTotalDePlata(sub + penalizareAmount);
  }, [sumaAmenda, dataContraventie]);

  // Current formData snapshot
  const currentFormData: FormData = useMemo(
    () => ({
      nume,
      prenume,
      cnp,
      email,
      telefon,
      adresa,
      numarProcesVerbal,
      dataContraventie,
      autoritateEmitenta,
      descriereContraventie,
      sumaAmenda: parseFloat(sumaAmenda) || 0,
      procentReducere: parseFloat(procentReducere) || 0,
      sumaReducere,
      subtotal,
      procentPenalizare: parseFloat(procentPenalizare) || 0,
      sumaPenalizare,
      totalDePlata,
    }),
    [
      nume,
      prenume,
      cnp,
      email,
      telefon,
      adresa,
      numarProcesVerbal,
      dataContraventie,
      autoritateEmitenta,
      descriereContraventie,
      sumaAmenda,
      procentReducere,
      sumaReducere,
      subtotal,
      procentPenalizare,
      sumaPenalizare,
      totalDePlata,
    ]
  );

  // Track "dirty since last save"
  useEffect(() => {
    if (!lastSavedData) {
      setDirtySinceSave(false);
      return;
    }
    const isDirty =
      JSON.stringify({ ...currentFormData }) !==
      JSON.stringify({
        ...lastSavedData,
        submissionTime: undefined,
        submissionDate: undefined,
        submissionTimeFormatted: undefined,
      });
    setDirtySinceSave(isDirty);
  }, [currentFormData, lastSavedData]);

  const validateForm = (): boolean => {
    setErrorMessage("");

    if (!nume || !prenume || !cnp || !email || !adresa) {
      setErrorMessage(
        "Vă rugăm completați toate câmpurile obligatorii din secțiunea Date Personale."
      );
      return false;
    }
    if (cnp.length !== 13 || !/^\d+$/.test(cnp)) {
      setErrorMessage("CNP-ul trebuie să conțină exact 13 cifre.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Vă rugăm introduceți o adresă de email validă.");
      return false;
    }
    if (
      !numarProcesVerbal ||
      !dataContraventie ||
      !autoritateEmitenta ||
      !descriereContraventie
    ) {
      setErrorMessage(
        "Vă rugăm completați toate câmpurile obligatorii din secțiunea Detalii Contravenție."
      );
      return false;
    }
    if (parseFloat(sumaAmenda) <= 0) {
      setErrorMessage("Suma amenzii trebuie să fie mai mare decât 0.");
      return false;
    }

    setIsFormValid(true);
    return true;
  };

  // PDF — ONLY from lastSavedData
  const handleGeneratePDF = async () => {
    if (!lastSavedData) {
      setErrorMessage(
        "Mai întâi salvați formularul. PDF-ul se generează din ultima salvare."
      );
      return;
    }
    try {
      await generatePaymentOrderPDF({
        ...lastSavedData,
        submissionTimeFormatted:
          lastSavedData.submissionTimeFormatted ||
          new Date().toLocaleString("ro-RO"),
      });
      setErrorMessage("");
    } catch (error) {
      console.error("PDF generation error:", error);
      setErrorMessage(
        "Nu s-a putut genera PDF-ul. Vă rugăm încercați din nou."
      );
    }
  };

  // SAVE: writes to formInputs AND xmlPayloads together
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: FormData = {
        ...currentFormData,
        submissionTime: new Date().toISOString(),
        submissionDate: new Date().toLocaleDateString("ro-RO"),
        submissionTimeFormatted: new Date().toLocaleString("ro-RO"),
      };

      const xml = generateXML(currentFormData);

      // Save both: formInputs and XML (xmlPayloads)
      await Promise.all([
        setDataToCollection("formInputs", payload),
        setDataToCollection("xmlPayloads", {
          xml,
          numarProcesVerbal: currentFormData.numarProcesVerbal,
          createdAt: new Date().toISOString(),
        }),
      ]);

      // remember "last saved" (for PDF)
      setLastSavedData(payload);
      setHasSavedOnce(true);
      setLastSavedAt(payload.submissionTimeFormatted || null);
      setDirtySinceSave(false);

      setErrorMessage("");
      showAlert("Succes", "Datele au fost trimise cu succes!");
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(
        "A apărut o eroare la trimiterea datelor. Vă rugăm încercați din nou."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 w-3/5 self-center`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`items-center pt-12 pb-8 px-4`}>
          <View
            style={tw`w-20 h-20 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg`}
          >
            <Ionicons name="document-text" size={40} color="#fff" />
          </View>
          <Text
            style={tw`text-3xl font-extrabold text-blue-900 mb-2 text-center`}
          >
            Plata Amenzi Online
          </Text>
          <Text style={tw`text-base text-gray-500 text-center px-4`}>
            Sistem Electronic de Plată a Contravențiilor - Rapid, Sigur,
            Eficient
          </Text>
        </View>

        {/* Card: Date Personale */}
        <View
          style={tw`bg-white mx-4 mb-6 rounded-2xl shadow-md overflow-hidden`}
        >
          <View style={tw`flex-row items-center bg-blue-600 p-5 gap-3`}>
            <Ionicons name="person" size={24} color="#fff" />
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-white mb-1`}>
                Date Personale
              </Text>
              <Text style={tw`text-sm text-white/90`}>
                Introduceți informațiile dumneavoastră personale
              </Text>
            </View>
          </View>

          <View style={tw`p-5`}>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Nume <Text style={tw`text-red-500`}>*</Text>
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                  value={nume}
                  onChangeText={setNume}
                  placeholder="Popescu"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Prenume <Text style={tw`text-red-500`}>*</Text>
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                  value={prenume}
                  onChangeText={setPrenume}
                  placeholder="Ion"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                CNP <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                value={cnp}
                onChangeText={setCnp}
                placeholder="1234567890123"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={13}
              />
            </View>

            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Email <Text style={tw`text-red-500`}>*</Text>
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ion.popescu@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Telefon
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                  value={telefon}
                  onChangeText={setTelefon}
                  placeholder="0712345678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                Adresă <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 min-h-20 pt-3`}
                value={adresa}
                onChangeText={setAdresa}
                placeholder="Str. Exemplu, Nr. 1, Sector 1, București"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Card: Detalii Contravenție */}
        <View
          style={tw`bg-white mx-4 mb-6 rounded-2xl shadow-md overflow-hidden`}
        >
          <View style={tw`flex-row items-center bg-purple-600 p-5 gap-3`}>
            <Ionicons name="document" size={24} color="#fff" />
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-white mb-1`}>
                Detalii Contravenție
              </Text>
              <Text style={tw`text-sm text-white/90`}>
                Informații despre procesul verbal
              </Text>
            </View>
          </View>

          <View style={tw`p-5`}>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Număr Proces Verbal <Text style={tw`text-red-500`}>*</Text>
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                  value={numarProcesVerbal}
                  onChangeText={setNumarProcesVerbal}
                  placeholder="PV-2025-001234"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Data Contravenției <Text style={tw`text-red-500`}>*</Text>
                </Text>

                {Platform.OS === "web" ? (
                  <input
                    type="date"
                    value={
                      dataContraventie
                        ? dataContraventie.split("/").reverse().join("-")
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split("-");
                        setDataContraventie(`${day}/${month}/${year}`);
                      }
                    }}
                    max={new Date().toISOString().split("T")[0]}
                    className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 w-full box-border"
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between`}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={tw`${
                          dataContraventie ? "text-gray-800" : "text-gray-400"
                        } text-base`}
                      >
                        {dataContraventie || "Selectează data"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                Autoritate Emitentă <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800`}
                value={autoritateEmitenta}
                onChangeText={setAutoritateEmitenta}
                placeholder="Poliția Locală Sector 1"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                Descriere Contravenție <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 min-h-24 pt-3`}
                value={descriereContraventie}
                onChangeText={setDescriereContraventie}
                placeholder="Descrieți contravenția..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        {/* Card: Calcul Financiar */}
        <View
          style={tw`bg-white mx-4 mb-6 rounded-2xl shadow-md overflow-hidden`}
        >
          <View style={tw`flex-row items-center bg-green-600 p-5 gap-3`}>
            <Ionicons name="calculator" size={24} color="#fff" />
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-white mb-1`}>
                Calcul Financiar
              </Text>
              <Text style={tw`text-sm text-white/90`}>
                Calculul automat al sumei de plată
              </Text>
            </View>
          </View>

          <View style={tw`p-5`}>
            <View style={tw`mb-5`}>
              <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                Suma Amendă (RON) <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                style={tw`bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 font-semibold`}
                value={sumaAmenda}
                onChangeText={setSumaAmenda}
                placeholder="500.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Procent Reducere (%)
                </Text>
                <View
                  style={tw`bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 items-center`}
                >
                  <Text style={tw`text-base font-semibold text-gray-700`}>
                    {procentReducere}%
                  </Text>
                </View>
                <Text style={tw`text-xs mt-1 font-semibold text-green-600`}>
                  Reducere: {sumaReducere.toFixed(2)} RON
                </Text>
                <Text style={tw`text-[11px] text-gray-500 mt-0.5 italic`}>
                  {daysSinceViolation < 0
                    ? "Data în viitor - selectați o dată validă"
                    : daysSinceViolation === 0
                    ? "Plată în aceeași zi - reducere maximă"
                    : daysSinceViolation <= 15
                    ? `Reducere pentru plata în termen (${daysSinceViolation} zile)`
                    : daysSinceViolation <= 30
                    ? `Reducere pentru plata în termen (${daysSinceViolation} zile)`
                    : `Plată după termen (${daysSinceViolation} zile) - penalizare aplicată`}
                </Text>
              </View>

              <View style={tw`flex-1 mb-5`}>
                <Text style={tw`text-[15px] font-semibold text-gray-800 mb-2`}>
                  Procent Penalizare (%)
                </Text>
                <View
                  style={tw`bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 items-center`}
                >
                  <Text style={tw`text-base font-semibold text-gray-700`}>
                    {procentPenalizare}%
                  </Text>
                </View>
                <Text style={tw`text-xs mt-1 font-semibold text-red-600`}>
                  Penalizare: {sumaPenalizare.toFixed(2)} RON
                </Text>
                <Text style={tw`text-[11px] text-gray-500 mt-0.5 italic`}>
                  {daysSinceViolation < 0
                    ? "Data în viitor - selectați o dată validă"
                    : daysSinceViolation <= 30
                    ? "Fără penalizare - plata în termen"
                    : `Penalizare pentru plata după termen (${daysSinceViolation} zile)`}
                </Text>
              </View>
            </View>

            {/* Summary */}
            <View
              style={tw`bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mt-2`}
            >
              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={tw`text-[15px] text-gray-700`}>Suma Amendă:</Text>
                <Text style={tw`text-[15px] font-semibold text-gray-900`}>
                  {parseFloat(sumaAmenda || "0").toFixed(2)} RON
                </Text>
              </View>

              {parseFloat(procentReducere || "0") > 0 && (
                <View style={tw`flex-row justify-between mb-3`}>
                  <Text style={tw`text-[15px] text-green-600`}>
                    Reducere ({procentReducere}%):
                  </Text>
                  <Text style={tw`text-[15px] font-semibold text-green-600`}>
                    -{sumaReducere.toFixed(2)} RON
                  </Text>
                </View>
              )}

              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={tw`text-[15px] text-gray-700`}>Subtotal:</Text>
                <Text style={tw`text-[15px] font-semibold text-gray-900`}>
                  {subtotal.toFixed(2)} RON
                </Text>
              </View>

              {parseFloat(procentPenalizare || "0") > 0 && (
                <View style={tw`flex-row justify-between mb-3`}>
                  <Text style={tw`text-[15px] text-red-600`}>
                    Penalizare ({procentPenalizare}%):
                  </Text>
                  <Text style={tw`text-[15px] font-semibold text-red-600`}>
                    +{sumaPenalizare.toFixed(2)} RON
                  </Text>
                </View>
              )}

              <View style={tw`h-0.5 bg-blue-200 my-2`} />

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-lg font-bold text-blue-900`}>
                  TOTAL DE PLATĂ:
                </Text>
                <Text style={tw`text-2xl font-extrabold text-blue-900`}>
                  {totalDePlata.toFixed(2)} RON
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={tw`bg-white mx-4 mb-6 rounded-2xl p-5 shadow-md gap-3`}>
          {/* Statistics Button */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-center bg-transparent border-2 border-purple-600 rounded-xl py-4 gap-2`}
            onPress={() => goToScreen("Statistics")}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart" size={20} color="#7C3AED" />
            <Text style={tw`text-[15px] font-semibold text-purple-600`}>
              Vezi Statistici
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center justify-center bg-transparent border-2 border-purple-600 rounded-xl py-4 gap-2`}
            onPress={() => goToScreen("Crawler")}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={20} color="#7C3AED" />
            <Text style={tw`text-[15px] font-semibold text-purple-600`}>
              Colecteaza PAP-uri
            </Text>
          </TouchableOpacity>

          {!!errorMessage && (
            <View
              style={tw`flex-row items-center bg-red-50 border border-red-200 rounded-lg p-3 mb-2 gap-2`}
            >
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={tw`flex-1 text-sm text-red-600 font-medium`}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* PDF button — hidden until first save */}
          {hasSavedOnce && (
            <>
              <TouchableOpacity
                style={tw`flex-row items-center justify-center bg-transparent border-2 border-blue-600 rounded-xl py-4 gap-2`}
                onPress={handleGeneratePDF}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#2563EB"
                />
                <Text style={tw`text-[15px] font-semibold text-blue-600`}>
                  Descarcă PDF (din ultima salvare)
                </Text>
              </TouchableOpacity>

              <Text style={tw`text-xs text-gray-500 text-center`}>
                {dirtySinceSave
                  ? "Ai modificări nesalvate. PDF-ul folosește datele vechi până salvezi din nou."
                  : lastSavedAt
                  ? `Ultima salvare: ${lastSavedAt}`
                  : "Datele salvate sunt actuale."}
              </Text>
            </>
          )}

          {/* SUBMIT (Save): also writes XML to DB; no separate XML button */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-center bg-blue-600 rounded-xl py-4 gap-2 ${
              isSubmitting ? "opacity-60" : ""
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={tw`text-white text-[17px] font-bold`}>
                  Se trimite...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={24} color="#fff" />
                <Text style={tw`text-white text-[17px] font-bold`}>
                  Trimite
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={tw`items-center py-8 px-4`}>
          <Text style={tw`text-[15px] text-gray-600 font-semibold mb-2`}>
            Sistem Electronic de Plată a Contravențiilor
          </Text>
          <Text style={tw`text-[13px] text-gray-500`}>
            🔒 Toate datele sunt protejate și transmise în siguranță
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
