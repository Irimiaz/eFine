import { Platform, Alert } from "react-native";

export const generateCSV = (
  documents: Array<{
    site_root: string;
    page_found_on: string;
    title: string;
    url: string;
    type: string;
    year: number | null;
  }>,
  siteName?: string
): string => {
  // CSV escape function - wraps in quotes and escapes internal quotes
  const escapeCSV = (value: string | number | null): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // CSV header
  const headers = [
    "Site Root",
    "Page Found On",
    "Title",
    "URL",
    "Type",
    "Year",
  ];

  // Build CSV content
  const rows = documents.map((doc) => [
    escapeCSV(doc.site_root),
    escapeCSV(doc.page_found_on),
    escapeCSV(doc.title),
    escapeCSV(doc.url),
    escapeCSV(doc.type),
    escapeCSV(doc.year),
  ]);

  // Combine header and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Add BOM for UTF-8 to ensure proper encoding in Excel
  return "\uFEFF" + csvContent;
};

// ===== Platform-specific CSV download =====
export const downloadCSV = async (csv: string, filename: string) => {
  if (Platform.OS === "web") {
    // Web implementation
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Native implementation
    const FileSystem = require("expo-file-system");
    const Sharing = require("expo-sharing");

    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("CSV generat", `Salvat la: ${fileUri}`);
    }
  }
};
