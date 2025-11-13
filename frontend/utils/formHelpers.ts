import { Platform, Alert } from "react-native";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ===== XML generator (inline, RN-friendly) =====
export const generateXML = (data: any) => {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  return `<?xml version="1.0" encoding="UTF-8"?>
  <PlataAmenda xmlns="urn:ro:autoritate:plati:v1">
    <Meta>
      <IdPlata>${esc(`PL-${Date.now()}`)}</IdPlata>
      <Data>${new Date().toISOString()}</Data>
      <VersiuneFormular>1.0.0</VersiuneFormular>
    </Meta>
    <Platitor>
      <Nume>${esc(data.nume)}</Nume>
      <Prenume>${esc(data.prenume)}</Prenume>
      <CNP>${esc(data.cnp)}</CNP>
      <Email>${esc(data.email)}</Email>
      <Telefon>${esc(data.telefon || "")}</Telefon>
      <Adresa>${esc(data.adresa)}</Adresa>
    </Platitor>
    <Amenda>
      <PVNumar>${esc(data.numarProcesVerbal)}</PVNumar>
      <DataPV>${esc(data.dataContraventie)}</DataPV>
      <Emitent>${esc(data.autoritateEmitenta)}</Emitent>
      <Descriere>${esc(data.descriereContraventie)}</Descriere>
    </Amenda>
    <Sume>
      <SumaAmenda>${data.sumaAmenda.toFixed(2)}</SumaAmenda>
      <ProcentReducere>${data.procentReducere.toFixed(2)}</ProcentReducere>
      <SumaReducere>${data.sumaReducere.toFixed(2)}</SumaReducere>
      <Subtotal>${data.subtotal.toFixed(2)}</Subtotal>
      <ProcentPenalizare>${data.procentPenalizare.toFixed(
        2
      )}</ProcentPenalizare>
      <SumaPenalizare>${data.sumaPenalizare.toFixed(2)}</SumaPenalizare>
      <TotalDePlata>${data.totalDePlata.toFixed(2)}</TotalDePlata>
      <Moneda>RON</Moneda>
      <Referinta>${esc(`${data.numarProcesVerbal}-${data.cnp}`)}</Referinta>
    </Sume>
  </PlataAmenda>`;
};

// ===== Platform-specific XML download =====
export const downloadXML = async (xml: string, filename: string) => {
  if (Platform.OS === "web") {
    // Web implementation
    const blob = new Blob([xml], { type: "application/xml" });
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
    await FileSystem.writeAsStringAsync(fileUri, xml, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("XML generat", `Salvat la: ${fileUri}`);
    }
  }
};

// ===== Platform-specific PDF generation =====
// ===== Enhanced PDF (payment order) generator with pdf-lib =====
export const generatePaymentOrderPDF = async (data: any) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper functions
  const drawText = (text: string, x: number, y: number, options: any = {}) => {
    page.drawText(text, {
      x,
      y,
      size: options.size || 12,
      font: options.font || font,
      color: options.color || rgb(0, 0, 0),
    });
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = rgb(0.8, 0.8, 0.8)
  ) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1,
      color,
    });
  };

  const drawRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    color = rgb(0.9, 0.9, 0.9)
  ) => {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      color,
    });
  };

  let y = height - margin;

  // Header with background
  const headerHeight = 80;
  page.drawRectangle({
    x: margin,
    y: y - headerHeight,
    width: width - 2 * margin,
    height: headerHeight,
    color: rgb(0.2, 0.4, 0.8), // Blue background
  });

  // Header text
  drawText("ORDIN DE PLATA - AMENDA", margin + 20, y - 30, {
    size: 20,
    font: fontTitle,
    color: rgb(1, 1, 1),
  });

  drawText(
    "Sistem Electronic de Plata a Contraventiilor",
    margin + 20,
    y - 50,
    {
      size: 12,
      color: rgb(0.9, 0.9, 0.9),
    }
  );

  // Submission info in header
  const submissionTime =
    data.submissionTimeFormatted || new Date().toLocaleString("ro-RO");
  drawText(`Generat la: ${submissionTime}`, margin + 20, y - 65, {
    size: 10,
    color: rgb(0.9, 0.9, 0.9),
  });

  y -= headerHeight + 30;

  // Payer Information Section
  drawRect(margin, y - 120, width - 2 * margin, 120);
  drawText("INFORMATII PLATITOR", margin + 15, y - 20, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });

  const payerInfo = [
    [`Nume: ${data.nume} ${data.prenume}`, `CNP: ${data.cnp}`],
    [`Email: ${data.email}`, `Telefon: ${data.telefon || "N/A"}`],
    [`Adresa: ${data.adresa}`, ""],
  ];

  let payerY = y - 45;
  payerInfo.forEach(([left, right]) => {
    drawText(left, margin + 20, payerY, { size: 11 });
    if (right) {
      drawText(right, width / 2, payerY, { size: 11 });
    }
    payerY -= 20;
  });

  y -= 140;

  // Fine Details Section
  drawRect(margin, y - 120, width - 2 * margin, 120);
  drawText("DETALII CONTRAVENTIE", margin + 15, y - 20, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });

  const fineInfo = [
    [
      `Numar Proces Verbal: ${data.numarProcesVerbal}`,
      `Data: ${data.dataContraventie}`,
    ],
    [`Autoritate Emitenta: ${data.autoritateEmitenta}`, ""],
    [`Descriere: ${data.descriereContraventie}`, ""],
  ];

  let fineY = y - 45;
  fineInfo.forEach(([left, right]) => {
    drawText(left, margin + 20, fineY, { size: 11 });
    if (right) {
      drawText(right, width / 2, fineY, { size: 11 });
    }
    fineY -= 20;
  });

  y -= 140;

  // Financial Summary Section
  drawRect(margin, y - 200, width - 2 * margin, 200);
  drawText("CALCUL FINANCIAR", margin + 15, y - 20, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });

  // Financial details
  const financialData = [
    {
      label: "Suma Amenda:",
      value: `${data.sumaAmenda.toFixed(2)} RON`,
      color: rgb(0, 0, 0),
    },
    {
      label: `Reducere (${data.procentReducere}%):`,
      value: `-${data.sumaReducere.toFixed(2)} RON`,
      color: rgb(0, 0.6, 0),
    },
    {
      label: "Subtotal:",
      value: `${data.subtotal.toFixed(2)} RON`,
      color: rgb(0, 0, 0),
    },
    {
      label: `Penalizare (${data.procentPenalizare}%):`,
      value: `+${data.sumaPenalizare.toFixed(2)} RON`,
      color: rgb(0.8, 0, 0),
    },
  ];

  let financialY = y - 50;
  financialData.forEach((item) => {
    drawText(item.label, margin + 20, financialY, { size: 12 });
    drawText(item.value, width - margin - 120, financialY, {
      size: 12,
      font: fontBold,
      color: item.color,
    });
    financialY -= 25;
  });

  // Total section with special styling
  drawLine(margin + 20, financialY - 10, width - margin - 20, financialY - 10);
  drawText("TOTAL DE PLATA:", margin + 20, financialY - 35, {
    size: 16,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  drawText(
    `${data.totalDePlata.toFixed(2)} RON`,
    width - margin - 120,
    financialY - 35,
    {
      size: 18,
      font: fontBold,
      color: rgb(0.2, 0.4, 0.8),
    }
  );

  y -= 220;

  // Footer
  drawText(
    "Acest document a fost generat electronic si este valabil fara semnatura.",
    margin,
    y - 20,
    { size: 10, color: rgb(0.5, 0.5, 0.5) }
  );

  drawText(
    "Sistem Electronic de Plata a Contraventiilor - www.efine.ro",
    margin,
    y - 40,
    { size: 10, color: rgb(0.5, 0.5, 0.5) }
  );

  const pdfBytes = await pdfDoc.save();
  const filename = `PaymentOrder_${data.numarProcesVerbal}_${Date.now()}.pdf`;

  if (Platform.OS === "web") {
    // Web implementation
    const arrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
    const blob = new Blob([arrayBuffer as ArrayBuffer], {
      type: "application/pdf",
    });
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

    const base64String = btoa(String.fromCharCode(...pdfBytes));

    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("PDF generat", `Salvat la: ${fileUri}`);
    }
  }
};

export const generateStatisticsPDF = async (stats: any, data: any[]) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, x: number, y: number, options: any = {}) => {
    page.drawText(text, {
      x,
      y,
      size: options.size || 12,
      font: options.font || font,
      color: options.color || rgb(0, 0, 0),
    });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
  };

  const drawRect = (x: number, y: number, w: number, h: number, color: any) => {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      color,
    });
  };

  let y = height - margin;

  // Header
  page.drawRectangle({
    x: margin,
    y: y - 80,
    width: width - 2 * margin,
    height: 80,
    color: rgb(0.2, 0.4, 0.8),
  });

  drawText("RAPORT STATISTICI - SISTEM PLATA AMENZI", margin + 20, y - 30, {
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  drawText(
    `Generat la: ${new Date().toLocaleString("ro-RO")}`,
    margin + 20,
    y - 55,
    { size: 10, color: rgb(0.9, 0.9, 0.9) }
  );

  y -= 100;

  // Summary Section
  drawText("REZUMAT GENERAL", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 25;

  const summaryData = [
    ["Total Formulare:", stats.totalSubmissions.toString()],
    ["Total Incasat:", `${stats.totalRevenue.toFixed(2)} RON`],
    ["Medie Suma/Formular:", `${stats.averageFine.toFixed(2)} RON`],
  ];

  summaryData.forEach(([label, value]) => {
    drawText(label, margin, y, { size: 11 });
    drawText(value, width - margin - 100, y, { size: 11, font: fontBold });
    y -= 20;
  });

  y -= 20;

  // Analysis 1: Payment Timing
  drawText("ANALIZA 1: TIMPUL DE PLATA", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 20;

  // Bar chart representation
  const barWidth = width - 2 * margin - 200;
  const barHeight = 15;

  // Early payments bar
  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.earlyPaymentPercentage) / 100,
    barHeight,
    rgb(0, 0.6, 0)
  );
  drawText(
    `Plati in Termen: ${stats.earlyPaymentPercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 25;

  // On-time payments bar
  const onTimePercentage =
    (stats.onTimePayments / stats.totalSubmissions) * 100;
  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * onTimePercentage) / 100,
    barHeight,
    rgb(0.4, 0.4, 0.4)
  );
  drawText(
    `Plati Standard: ${onTimePercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 25;

  // Late payments bar
  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.latePaymentPercentage) / 100,
    barHeight,
    rgb(0.8, 0, 0)
  );
  drawText(
    `Plati Dupa Termen: ${stats.latePaymentPercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 30;

  // Analysis 2: Fine Amount Distribution
  drawText("ANALIZA 2: DISTRIBUTIA SUMEI AMENZILOR", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 20;

  // Fine distribution bars
  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.lowFinePercentage) / 100,
    barHeight,
    rgb(0.2, 0.5, 1)
  );
  drawText(
    `Amenzi Mici (< 200 RON): ${stats.lowFinePercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 25;

  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.mediumFinePercentage) / 100,
    barHeight,
    rgb(0.5, 0.3, 1)
  );
  drawText(
    `Amenzi Medii (200-500 RON): ${stats.mediumFinePercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 25;

  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.highFinePercentage) / 100,
    barHeight,
    rgb(0.9, 0.3, 0.3)
  );
  drawText(
    `Amenzi Mari (> 500 RON): ${stats.highFinePercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 30;

  // Footer
  drawText(
    "Acest raport a fost generat automat de Sistemul Electronic de Plata a Contraventiilor.",
    margin,
    y,
    { size: 9, color: rgb(0.5, 0.5, 0.5) }
  );

  const pdfBytes = await pdfDoc.save();
  const filename = `Raport_Statistici_${Date.now()}.pdf`;

  if (Platform.OS === "web") {
    const arrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
    const blob = new Blob([arrayBuffer as ArrayBuffer], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const FileSystem = require("expo-file-system");
    const Sharing = require("expo-sharing");

    const base64String = btoa(String.fromCharCode(...pdfBytes));

    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("PDF generat", `Salvat la: ${fileUri}`);
    }
  }
};
