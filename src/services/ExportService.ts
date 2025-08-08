import { AsphaltRegion } from '@/components/Map/ComputerVisionService';

export interface ExportOptions {
  format: 'png' | 'pdf' | 'email' | 'print' | 'contract' | 'report';
  includeMap?: boolean;
  includeWhiteBackground?: boolean;
  includeMetadata?: boolean;
  resolution?: 'low' | 'medium' | 'high' | 'print';
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal' | 'tabloid';
}

export interface AsphaltAnalysisData {
  surfaces: AsphaltRegion[];
  totalArea: number;
  drivewayCount: number;
  parkingLotCount: number;
  analysisDate: Date;
  location: {
    center: [number, number];
    bounds: [[number, number], [number, number]];
  };
  mapImageData?: string;
}

export class ExportService {
  
  // Export as PNG image
  static async exportAsPNG(
    data: AsphaltAnalysisData, 
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    try {
      const canvas = await this.createCanvas(data, {
        ...options,
        format: 'png',
        resolution: options.resolution || 'high'
      });
      
      const link = document.createElement('a');
      link.download = this.generateFilename(data, 'png');
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('PNG export failed:', error);
      throw new Error('Failed to export PNG');
    }
  }

  // Export as PDF document
  static async exportAsPDF(
    data: AsphaltAnalysisData, 
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    try {
      // Dynamic import to avoid loading jsPDF unless needed
      const { jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const pdf = new jsPDF(
        options.orientation || 'landscape',
        'mm', 
        options.pageSize || 'a4'
      );
      
      // Create PDF content
      await this.createPDFContent(pdf, data, options);
      
      pdf.save(this.generateFilename(data, 'pdf'));
      
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export PDF');
    }
  }

  // Prepare for email attachment
  static async prepareEmailAttachment(
    data: AsphaltAnalysisData,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    try {
      const subject = encodeURIComponent('Asphalt Analysis Report');
      const body = this.generateEmailBody(data);
      
      // For basic email, open mailto link
      const emailUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
      window.open(emailUrl);
      
      // If we have a proper backend, we could handle attachments here
      // For now, suggest user manually attach exported files
      const attachmentNote = encodeURIComponent('\n\nNote: Please export as PDF and attach manually.');
      const fullEmailUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(body + attachmentNote)}`;
      
      setTimeout(() => {
        if (confirm('Would you like to export a PDF to attach manually?')) {
          this.exportAsPDF(data, options);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Email preparation failed:', error);
      throw new Error('Failed to prepare email');
    }
  }

  // Print analysis
  static async printAnalysis(
    data: AsphaltAnalysisData,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups for printing');
      }
      
      const printContent = await this.generatePrintContent(data, options);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Optionally close after printing
          // printWindow.close();
        }, 500);
      };
      
    } catch (error) {
      console.error('Print failed:', error);
      throw new Error('Failed to print analysis');
    }
  }

  // Generate contract integration data
  static async generateContractData(
    data: AsphaltAnalysisData,
    options: Partial<ExportOptions> = {}
  ): Promise<string> {
    try {
      const contractData = {
        analysisDate: data.analysisDate.toISOString(),
        location: data.location,
        totalArea: data.totalArea,
        surfaces: data.surfaces.map(surface => ({
          type: surface.surfaceType,
          area: surface.area,
          length: surface.length,
          width: surface.width,
          confidence: surface.confidence,
          coordinates: surface.polygon
        })),
        summary: {
          drivewayCount: data.drivewayCount,
          parkingLotCount: data.parkingLotCount,
          totalSquareFeet: data.totalArea,
          totalAcres: data.totalArea / 43560
        }
      };
      
      return JSON.stringify(contractData, null, 2);
      
    } catch (error) {
      console.error('Contract data generation failed:', error);
      throw new Error('Failed to generate contract data');
    }
  }

  // Generate comprehensive report
  static async generateReport(
    data: AsphaltAnalysisData,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    try {
      const reportWindow = window.open('', '_blank', 'width=900,height=700');
      if (!reportWindow) {
        throw new Error('Popup blocked - please allow popups for reports');
      }
      
      const reportContent = await this.generateReportContent(data, options);
      
      reportWindow.document.write(reportContent);
      reportWindow.document.close();
      
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error('Failed to generate report');
    }
  }

  // Helper: Create canvas for image exports
  private static async createCanvas(
    data: AsphaltAnalysisData, 
    options: ExportOptions
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    // Set canvas size based on resolution
    const resolution = this.getResolution(options.resolution || 'high');
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    
    // Set background
    if (options.includeWhiteBackground) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw map if included
    if (options.includeMap && data.mapImageData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = data.mapImageData;
    }
    
    // Add analysis overlay
    this.drawAnalysisOverlay(ctx, data, canvas.width, canvas.height);
    
    return canvas;
  }

  // Helper: Create PDF content
  private static async createPDFContent(
    pdf: import('jspdf').jsPDF, 
    data: AsphaltAnalysisData, 
    options: Partial<ExportOptions>
  ): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Title
    pdf.setFontSize(20);
    pdf.text('Asphalt Analysis Report', pageWidth / 2, 20, { align: 'center' });
    
    // Analysis date
    pdf.setFontSize(12);
    pdf.text(`Analysis Date: ${data.analysisDate.toLocaleDateString()}`, 20, 35);
    
    // Summary statistics
    let yPos = 50;
    pdf.setFontSize(16);
    pdf.text('Summary', 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(12);
    const summaryData = [
      `Total Asphalt Area: ${data.totalArea.toFixed(0)} sq ft (${(data.totalArea / 43560).toFixed(4)} acres)`,
      `Driveways Detected: ${data.drivewayCount}`,
      `Parking Lots Detected: ${data.parkingLotCount}`,
      `Total Surfaces: ${data.surfaces.length}`
    ];
    
    summaryData.forEach(line => {
      yPos += 8;
      pdf.text(line, 20, yPos);
    });
    
    // Detailed surface analysis
    yPos += 20;
    pdf.setFontSize(16);
    pdf.text('Detailed Analysis', 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(10);
    
    // Table header
    const tableHeaders = ['Type', 'Length (ft)', 'Width (ft)', 'Area (sq ft)', 'Confidence'];
    const colWidths = [40, 30, 30, 35, 30];
    let xPos = 20;
    
    tableHeaders.forEach((header, i) => {
      pdf.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    
    yPos += 5;
    pdf.line(20, yPos, pageWidth - 20, yPos); // Horizontal line
    
    // Table data
    data.surfaces.forEach(surface => {
      yPos += 8;
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 30;
      }
      
      xPos = 20;
      const rowData = [
        surface.surfaceType.replace('_', ' '),
        surface.length.toFixed(1),
        surface.width.toFixed(1),
        surface.area.toFixed(0),
        `${(surface.confidence * 100).toFixed(1)}%`
      ];
      
      rowData.forEach((data, i) => {
        pdf.text(data, xPos, yPos);
        xPos += colWidths[i];
      });
    });
    
    // Add map image if available
    if (options.includeMap && data.mapImageData) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Satellite Analysis', 20, 20);
      
      try {
        // Add map image
        const imgWidth = pageWidth - 40;
        const imgHeight = (pageHeight - 60) * 0.7;
        pdf.addImage(data.mapImageData, 'JPEG', 20, 35, imgWidth, imgHeight);
      } catch (error) {
        console.warn('Could not add map image to PDF:', error);
      }
    }
  }

  // Helper: Generate email body
  private static generateEmailBody(data: AsphaltAnalysisData): string {
    return `
Asphalt Analysis Report

Analysis Date: ${data.analysisDate.toLocaleDateString()}

SUMMARY:
- Total Asphalt Area: ${data.totalArea.toFixed(0)} sq ft (${(data.totalArea / 43560).toFixed(4)} acres)
- Driveways Detected: ${data.drivewayCount}
- Parking Lots Detected: ${data.parkingLotCount}
- Total Surfaces Analyzed: ${data.surfaces.length}

DETAILED BREAKDOWN:
${data.surfaces.map(surface => 
  `• ${surface.surfaceType.replace('_', ' ').toUpperCase()}: ${surface.length.toFixed(1)} x ${surface.width.toFixed(1)} ft = ${surface.area.toFixed(0)} sq ft (${(surface.confidence * 100).toFixed(1)}% confidence)`
).join('\n')}

This analysis was generated using AI-powered computer vision technology for precise asphalt surface detection and measurement.
    `.trim();
  }

  // Helper: Generate print content
  private static async generatePrintContent(
    data: AsphaltAnalysisData,
    options: Partial<ExportOptions>
  ): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Asphalt Analysis Report</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      line-height: 1.6;
      color: #333;
    }
    .header { 
      text-align: center; 
      border-bottom: 2px solid #333; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .summary { 
      background: #f8f9fa; 
      padding: 20px; 
      border-left: 4px solid #007bff;
      margin-bottom: 30px;
    }
    .surface-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 30px;
    }
    .surface-table th, .surface-table td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left;
    }
    .surface-table th { 
      background: #f8f9fa; 
      font-weight: bold;
    }
    .surface-table tr:nth-child(even) { 
      background: #f8f9fa;
    }
    .footer { 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 1px solid #ddd; 
      text-align: center; 
      color: #666; 
      font-size: 12px;
    }
    .confidence-high { color: #28a745; font-weight: bold; }
    .confidence-medium { color: #ffc107; font-weight: bold; }
    .confidence-low { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Asphalt Analysis Report</h1>
    <p>AI-Powered Surface Detection & Measurement</p>
    <p><strong>Analysis Date:</strong> ${data.analysisDate.toLocaleDateString()}</p>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
      <div>
        <p><strong>Total Asphalt Area:</strong><br>${data.totalArea.toFixed(0)} sq ft (${(data.totalArea / 43560).toFixed(4)} acres)</p>
        <p><strong>Surfaces Detected:</strong><br>${data.surfaces.length} total areas</p>
      </div>
      <div>
        <p><strong>Driveways:</strong><br>${data.drivewayCount} detected</p>
        <p><strong>Parking Lots:</strong><br>${data.parkingLotCount} detected</p>
      </div>
    </div>
  </div>

  <h2>Detailed Analysis</h2>
  <table class="surface-table">
    <thead>
      <tr>
        <th>Surface Type</th>
        <th>Length (ft)</th>
        <th>Width (ft)</th>
        <th>Area (sq ft)</th>
        <th>Confidence</th>
        <th>Material</th>
      </tr>
    </thead>
    <tbody>
      ${data.surfaces.map(surface => {
        const confidenceClass = 
          surface.confidence > 0.9 ? 'confidence-high' :
          surface.confidence > 0.7 ? 'confidence-medium' : 'confidence-low';
        
        return `
          <tr>
            <td>${surface.surfaceType.replace('_', ' ').toUpperCase()}</td>
            <td>${surface.length.toFixed(1)}</td>
            <td>${surface.width.toFixed(1)}</td>
            <td>${surface.area.toFixed(0)}</td>
            <td class="${confidenceClass}">${(surface.confidence * 100).toFixed(1)}%</td>
            <td>Asphalt/Blacktop</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated using advanced computer vision AI technology.</p>
    <p>Analysis accuracy: Based on satellite imagery and AI confidence scores.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Print Report
    </button>
  </div>
</body>
</html>
    `;
  }

  // Helper: Generate comprehensive report content
  private static async generateReportContent(
    data: AsphaltAnalysisData,
    options: Partial<ExportOptions>
  ): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Asphalt Analysis Report</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #f8fafc;
      color: #1e293b;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 30px; 
      text-align: center;
    }
    .content { 
      padding: 30px;
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 20px; 
      margin: 30px 0;
    }
    .stat-card { 
      background: #f1f5f9; 
      padding: 20px; 
      border-radius: 8px; 
      text-align: center;
      border-left: 4px solid #3b82f6;
    }
    .stat-value { 
      font-size: 2rem; 
      font-weight: bold; 
      color: #1e40af;
      margin-bottom: 5px;
    }
    .stat-label { 
      color: #64748b; 
      font-size: 0.9rem;
    }
    .surface-grid {
      display: grid;
      gap: 15px;
      margin-top: 20px;
    }
    .surface-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
    }
    .surface-type {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .measurement-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 10px;
    }
    .measurement {
      text-align: center;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }
    .export-actions {
      margin-top: 30px;
      text-align: center;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      margin: 5px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn:hover {
      background: #2563eb;
    }
    .btn.secondary {
      background: #6b7280;
    }
    .btn.secondary:hover {
      background: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ Comprehensive Asphalt Analysis Report</h1>
      <p>AI-Powered Surface Detection & Measurement Analysis</p>
      <p><strong>Analysis Date:</strong> ${data.analysisDate.toLocaleDateString()}</p>
    </div>

    <div class="content">
      <h2>📊 Executive Summary</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${data.totalArea.toFixed(0)}</div>
          <div class="stat-label">Total Area (sq ft)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(data.totalArea / 43560).toFixed(4)}</div>
          <div class="stat-label">Total Area (acres)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.drivewayCount}</div>
          <div class="stat-label">Driveways</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.parkingLotCount}</div>
          <div class="stat-label">Parking Lots</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.surfaces.length}</div>
          <div class="stat-label">Total Surfaces</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(data.surfaces.reduce((sum, s) => sum + s.confidence, 0) / data.surfaces.length * 100).toFixed(1)}%</div>
          <div class="stat-label">Avg Confidence</div>
        </div>
      </div>

      <h2>🔍 Detailed Surface Analysis</h2>
      
      <div class="surface-grid">
        ${data.surfaces.map((surface, index) => `
          <div class="surface-card">
            <div class="surface-type">
              ${surface.surfaceType === 'driveway' ? '🚗' : surface.surfaceType === 'parking_lot' ? '🅿️' : surface.surfaceType === 'road' ? '🛣️' : '🚶'} 
              ${surface.surfaceType.replace('_', ' ').toUpperCase()} #${index + 1}
            </div>
            
            <div class="measurement-grid">
              <div class="measurement">
                <strong>${surface.length.toFixed(1)} ft</strong><br>
                <small>Length</small>
              </div>
              <div class="measurement">
                <strong>${surface.width.toFixed(1)} ft</strong><br>
                <small>Width</small>
              </div>
              <div class="measurement">
                <strong>${surface.area.toFixed(0)} sq ft</strong><br>
                <small>Area</small>
              </div>
            </div>
            
            <div style="margin-top: 10px; text-align: center;">
              <span style="background: ${surface.confidence > 0.9 ? '#10b981' : surface.confidence > 0.7 ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${(surface.confidence * 100).toFixed(1)}% Confidence
              </span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="export-actions">
        <h3>📤 Export Options</h3>
        <p>Generate reports and export data in various formats</p>
        
        <button class="btn" onclick="window.print()">🖨️ Print Report</button>
        <button class="btn secondary" onclick="exportData('pdf')">📄 Export PDF</button>
        <button class="btn secondary" onclick="exportData('csv')">📊 Export CSV</button>
        <button class="btn secondary" onclick="exportData('json')">💾 Export JSON</button>
      </div>
    </div>
  </div>

  <script>
    function exportData(format) {
      const data = ${JSON.stringify(data)};
      
      switch(format) {
        case 'pdf':
          alert('PDF export functionality would be implemented here');
          break;
        case 'csv':
          exportCSV(data);
          break;
        case 'json':
          exportJSON(data);
          break;
      }
    }
    
    function exportCSV(data) {
      const csvContent = [
        ['Surface Type', 'Length (ft)', 'Width (ft)', 'Area (sq ft)', 'Confidence (%)'],
        ...data.surfaces.map(s => [
          s.surfaceType.replace('_', ' '),
          s.length.toFixed(1),
          s.width.toFixed(1),
          s.area.toFixed(0),
          (s.confidence * 100).toFixed(1)
        ])
      ].map(row => row.join(',')).join('\\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asphalt-analysis.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    function exportJSON(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asphalt-analysis.json';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>
    `;
  }

  // Helper: Draw analysis overlay on canvas
  private static drawAnalysisOverlay(
    ctx: CanvasRenderingContext2D,
    data: AsphaltAnalysisData,
    width: number,
    height: number
  ): void {
    // Draw title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Asphalt Analysis Results', width / 2, 40);
    
    // Draw statistics
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const stats = [
      `Total Area: ${data.totalArea.toFixed(0)} sq ft`,
      `Driveways: ${data.drivewayCount}`,
      `Parking Lots: ${data.parkingLotCount}`,
      `Analysis Date: ${data.analysisDate.toLocaleDateString()}`
    ];
    
    stats.forEach((stat, index) => {
      ctx.fillText(stat, 20, 80 + (index * 25));
    });
  }

  // Helper: Get resolution settings
  private static getResolution(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case 'low': return { width: 800, height: 600 };
      case 'medium': return { width: 1200, height: 900 };
      case 'high': return { width: 1920, height: 1440 };
      case 'print': return { width: 2400, height: 1800 };
      default: return { width: 1200, height: 900 };
    }
  }

  // Helper: Generate filename
  private static generateFilename(data: AsphaltAnalysisData, extension: string): string {
    const date = data.analysisDate.toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-6);
    return `asphalt-analysis-${date}-${timestamp}.${extension}`;
  }
}

export default ExportService;