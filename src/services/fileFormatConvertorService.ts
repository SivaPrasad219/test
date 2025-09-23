// FileFormatConversionService.ts
import json2xml from "json2xml";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export class FileFormatConversionService {
  // Method to convert JSON to XML
  jsonToXml(jsonData: any): string {
    console.log("::::::::::::jsonData", jsonData);
    return json2xml(jsonData);
  }

  // Method to convert JSON to PDF
  async jsonToPdf(element: HTMLElement): Promise<void> {
    try {
      const canvas = await html2canvas(element);
      console.log("canvas.toDataURL", canvas);
      const pdfContent = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
      });
      const imgProps = pdf.getImageProperties(pdfContent);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(pdfContent, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("download.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }

  // Method to convert JSON to string (JSON format)
  jsonToString(jsonData: any): string {
    console.log("::::::::::::jsonDataJSON string", jsonData);
    return JSON.stringify(jsonData, null, 2);
  }
}

// Create a singleton instance of the service
export const fileFormatConversionService = new FileFormatConversionService();
