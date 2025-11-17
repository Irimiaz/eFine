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

// Add this helper function to remove Romanian diacritics
const removeDiacritics = (text: string): string => {
  return text
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/Ă/g, "A")
    .replace(/Â/g, "A")
    .replace(/Î/g, "I")
    .replace(/Ș/g, "S")
    .replace(/Ț/g, "T");
};

// Updated PDF generation function
export const generateStatisticsPDF = async (stats: any, data: any[]) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, x: number, y: number, options: any = {}) => {
    const cleanText = removeDiacritics(text);
    page.drawText(cleanText, {
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
    color: any = rgb(0.15, 0.39, 0.88),
    thickness: number = 2
  ) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color,
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
    `Generat la: ${removeDiacritics(new Date().toLocaleString("ro-RO"))}`,
    margin + 20,
    y - 55,
    { size: 10, color: rgb(0.9, 0.9, 0.9) }
  );

  y -= 100;

  // Stats Cards Section
  drawText("STATISTICI GENERALE", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 25;

  const cardWidth = (width - 2 * margin - 40) / 3;
  const cardHeight = 60;

  // Card 1: Total Submissions
  drawRect(margin, y - cardHeight, cardWidth, cardHeight, rgb(1, 1, 1));
  drawRect(margin, y - cardHeight, cardWidth, 3, rgb(0.15, 0.39, 0.88));
  drawText("Numar de amenzi platite", margin + 10, y - 20, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  });
  drawText(stats.totalSubmissions.toString(), margin + 10, y - 40, {
    size: 20,
    font: fontBold,
  });

  // Card 2: Total Revenue
  drawRect(
    margin + cardWidth + 20,
    y - cardHeight,
    cardWidth,
    cardHeight,
    rgb(1, 1, 1)
  );
  drawRect(
    margin + cardWidth + 20,
    y - cardHeight,
    cardWidth,
    3,
    rgb(0.05, 0.59, 0.41)
  );
  drawText("Total suma platita", margin + cardWidth + 30, y - 20, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  });
  drawText(
    `${stats.totalRevenue.toFixed(2)} RON`,
    margin + cardWidth + 30,
    y - 40,
    {
      size: 16,
      font: fontBold,
    }
  );

  // Card 3: Average Fine
  drawRect(
    margin + 2 * (cardWidth + 20),
    y - cardHeight,
    cardWidth,
    cardHeight,
    rgb(1, 1, 1)
  );
  drawRect(
    margin + 2 * (cardWidth + 20),
    y - cardHeight,
    cardWidth,
    3,
    rgb(0.49, 0.23, 0.93)
  );
  drawText(
    "Medie suma platita/Amenda",
    margin + 2 * (cardWidth + 20) + 10,
    y - 20,
    {
      size: 9,
      color: rgb(0.4, 0.4, 0.4),
    }
  );
  drawText(
    `${stats.averageFine.toFixed(2)} RON`,
    margin + 2 * (cardWidth + 20) + 10,
    y - 40,
    {
      size: 16,
      font: fontBold,
    }
  );

  y -= cardHeight + 30;

  // Analysis 1: Payment Timing
  drawText("TIMPUL DE PLATA", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 25;

  const barWidth = width - 2 * margin - 200;
  const barHeight = 15;

  // Early payments bar
  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.earlyPaymentPercentage) / 100,
    barHeight,
    rgb(0.05, 0.59, 0.41)
  );
  drawText(
    `Plati in Termen (cu Reducere): ${stats.earlyPaymentPercentage.toFixed(
      1
    )}%`,
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
    rgb(0.42, 0.45, 0.5)
  );
  drawText(
    `Plati Standard (fara Reducere/Penalizare): ${onTimePercentage.toFixed(
      1
    )}%`,
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
    rgb(0.86, 0.15, 0.15)
  );
  drawText(
    `Plati Dupa Termen (cu Penalizare): ${stats.latePaymentPercentage.toFixed(
      1
    )}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 30;

  // Analysis 2: Fine Amount Distribution
  drawText("DISTRIBUTIA SUMEI AMENZILOR", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 25;

  // Fine distribution bars
  drawRect(margin, y, barWidth, barHeight, rgb(0.9, 0.9, 0.9));
  drawRect(
    margin,
    y,
    (barWidth * stats.lowFinePercentage) / 100,
    barHeight,
    rgb(0.23, 0.51, 0.96)
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
    rgb(0.55, 0.31, 0.96)
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
    rgb(0.94, 0.27, 0.27)
  );
  drawText(
    `Amenzi Mari (> 500 RON): ${stats.highFinePercentage.toFixed(1)}%`,
    margin + barWidth + 10,
    y + 2,
    { size: 10 }
  );
  y -= 30;

  // Analysis 3: Daily Payments - Improved Line Chart
  if (stats.dailyPayments && stats.dailyPayments.length > 0) {
    drawText("PLATA ZILNICA (ULTIMELE 30 ZILE)", margin, y, {
      size: 14,
      font: fontBold,
      color: rgb(0.2, 0.4, 0.8),
    });
    y -= 25;

    const chartHeight = 120;
    const chartWidth = width - 2 * margin;
    const all30Days = stats.dailyPayments;
    const maxCount = Math.max(...all30Days.map((d: any) => d.count), 1);
    const chartStartX = margin;
    const chartStartY = y - chartHeight;
    const chartEndX = margin + chartWidth;
    const chartEndY = y;

    // Draw chart background
    drawRect(
      chartStartX,
      chartStartY,
      chartWidth,
      chartHeight,
      rgb(0.95, 0.95, 0.95)
    );

    // Draw grid lines
    for (let i = 0; i <= 4; i++) {
      const gridY = chartStartY + (chartHeight / 4) * i;
      drawLine(chartStartX, gridY, chartEndX, gridY, rgb(0.9, 0.9, 0.9), 0.5);
      // Y-axis labels (0 at bottom, maxCount at top - matching data positions)
      const value = (maxCount / 4) * i;
      drawText(Math.round(value).toString(), chartStartX - 25, gridY - 5, {
        size: 9,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Draw line chart
    const pointSpacing = chartWidth / (all30Days.length - 1);
    const points: Array<{ x: number; y: number }> = [];

    all30Days.forEach((day: any, index: number) => {
      const x = chartStartX + index * pointSpacing;
      const y = chartStartY + (day.count * chartHeight) / maxCount;
      points.push({ x, y });
      console.log(all30Days);
      // Draw data point
      page.drawCircle({
        x,
        y,
        size: 3,
        color: rgb(0.15, 0.39, 0.88),
      });
    });

    // Draw connecting lines
    for (let i = 0; i < points.length - 1; i++) {
      drawLine(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
        rgb(0.15, 0.39, 0.88),
        2
      );
    }

    // Draw X-axis labels (every 5 days)
    for (let i = 0; i < all30Days.length; i += 1) {
      const date = new Date(all30Days[i].date);
      const x = chartStartX + i * pointSpacing;
      drawText(date.getDate().toString(), x - 5, chartStartY - 15, { size: 8 });
    }

    y -= chartHeight + 50;
  }

  // Additional Statistics Section
  drawText("STATISTICI SUPLIMENTARE", margin, y, {
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 25;

  // Total Discounts
  drawText("Total Reduceri Acordate:", margin, y, { size: 11 });
  drawText(`${stats.totalDiscounts.toFixed(2)} RON`, width - margin - 100, y, {
    size: 11,
    font: fontBold,
    color: rgb(0.05, 0.59, 0.41),
  });
  y -= 20;

  // Average Discount
  drawText("Medie Reducere/Plata:", margin, y, { size: 11 });
  drawText(`${stats.averageDiscount.toFixed(2)} RON`, width - margin - 100, y, {
    size: 11,
    font: fontBold,
  });
  y -= 20;

  // Total Penalties
  drawText("Total Penalizari Aplicate:", margin, y, { size: 11 });
  drawText(`${stats.totalPenalties.toFixed(2)} RON`, width - margin - 100, y, {
    size: 11,
    font: fontBold,
    color: rgb(0.86, 0.15, 0.15),
  });
  y -= 20;

  // Average Penalty
  drawText("Medie Penalizare/Plata:", margin, y, { size: 11 });
  drawText(`${stats.averagePenalty.toFixed(2)} RON`, width - margin - 100, y, {
    size: 11,
    font: fontBold,
  });

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
