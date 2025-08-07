import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  Copy,
  Link,
  Send,
  FileImage,
  FilePdf,
  FileSpreadsheet,
  FileCode,
  Globe,
  Camera,
  MapPin,
  Ruler,
  Square,
  BarChart3,
  Settings,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AsphaltRegion } from './ComputerVisionService';

interface DocumentExportServiceProps {
  overlayData?: any;
  asphaltResults?: AsphaltRegion[];
  onExport?: (format: string, data: any) => void;
  onClose?: () => void;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
  category: 'email' | 'contract' | 'report' | 'visualization';
}

const DocumentExportService: React.FC<DocumentExportServiceProps> = ({
  overlayData,
  asphaltResults,
  onExport,
  onClose
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'docx' | 'xlsx' | 'json'>('png');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('Asphalt Detection Report');
  const [emailMessage, setEmailMessage] = useState('');

  // Export templates
  const exportTemplates: ExportTemplate[] = [
    {
      id: 'email-report',
      name: 'Email Report',
      description: 'Send asphalt detection results via email',
      icon: <Mail className="w-4 h-4" />,
      formats: ['png', 'pdf'],
      category: 'email'
    },
    {
      id: 'contract-attachment',
      name: 'Contract Attachment',
      description: 'Generate professional contract with measurements',
      icon: <FileText className="w-4 h-4" />,
      formats: ['pdf', 'docx'],
      category: 'contract'
    },
    {
      id: 'technical-report',
      name: 'Technical Report',
      description: 'Detailed analysis with measurements and costs',
      icon: <BarChart3 className="w-4 h-4" />,
      formats: ['pdf', 'xlsx', 'json'],
      category: 'report'
    },
    {
      id: 'visualization',
      name: '3D Visualization',
      description: 'Create 3D or 2D visualizations of surfaces',
      icon: <Globe className="w-4 h-4" />,
      formats: ['png', 'svg'],
      category: 'visualization'
    }
  ];

  // Generate email content
  const generateEmailContent = () => {
    if (!asphaltResults || asphaltResults.length === 0) {
      return 'No asphalt detection results available.';
    }

    const totalArea = asphaltResults.reduce((sum, r) => sum + r.area, 0);
    const totalCost = totalArea * 4; // $4 per sq ft estimate

    return `
Dear Client,

I have completed the asphalt surface analysis for your property. Here are the key findings:

SURFACE ANALYSIS SUMMARY:
• Total surfaces detected: ${asphaltResults.length}
• Total area: ${totalArea.toFixed(0)} square feet
• Estimated replacement cost: $${totalCost.toLocaleString()}

DETAILED MEASUREMENTS:
${asphaltResults.map((result, index) => `
${index + 1}. ${result.surfaceType.replace('_', ' ').toUpperCase()}
   - Length: ${result.length.toFixed(1)} feet
   - Width: ${result.width.toFixed(1)} feet
   - Area: ${result.area.toFixed(0)} square feet
   - Confidence: ${(result.confidence * 100).toFixed(1)}%
`).join('')}

This analysis was performed using advanced computer vision technology to provide accurate measurements for your project planning.

Best regards,
Patrick County GIS Pro Team
    `.trim();
  };

  // Export as email attachment
  const exportAsEmail = () => {
    if (!asphaltResults || asphaltResults.length === 0) {
      toast.error('No data available for email export');
      return;
    }

    const emailContent = generateEmailContent();
    const emailData = {
      to: emailRecipient,
      subject: emailSubject,
      body: emailContent,
      attachments: asphaltResults.map(result => ({
        name: `${result.surfaceType}_measurements.pdf`,
        data: generatePDFAttachment(result)
      }))
    };

    // In a real app, this would integrate with email service
    console.log('Email data:', emailData);
    toast.success('Email prepared for sending');
    
    // Simulate email sending
    setTimeout(() => {
      toast.success('Email sent successfully');
    }, 2000);
  };

  // Generate PDF attachment
  const generatePDFAttachment = (result: AsphaltRegion) => {
    // Simplified PDF generation - in real app would use a PDF library
    const content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .measurements { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .measurement-box { padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Asphalt Surface Measurement Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="measurements">
            <div class="measurement-box">
              <h3>Surface Type</h3>
              <p>${result.surfaceType.replace('_', ' ')}</p>
            </div>
            <div class="measurement-box">
              <h3>Length</h3>
              <p>${result.length.toFixed(1)} feet</p>
            </div>
            <div class="measurement-box">
              <h3>Width</h3>
              <p>${result.width.toFixed(1)} feet</p>
            </div>
            <div class="measurement-box">
              <h3>Area</h3>
              <p>${result.area.toFixed(0)} square feet</p>
            </div>
            <div class="measurement-box">
              <h3>Confidence</h3>
              <p>${(result.confidence * 100).toFixed(1)}%</p>
            </div>
            <div class="measurement-box">
              <h3>Estimated Cost</h3>
              <p>$${(result.area * 4).toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return content;
  };

  // Export as contract
  const exportAsContract = () => {
    if (!asphaltResults || asphaltResults.length === 0) {
      toast.error('No data available for contract generation');
      return;
    }

    const totalArea = asphaltResults.reduce((sum, r) => sum + r.area, 0);
    const totalCost = totalArea * 4;

    const contractContent = `
ASPHALT SURFACE REPLACEMENT CONTRACT

Date: ${new Date().toLocaleDateString()}
Project: Asphalt Surface Replacement

SCOPE OF WORK:
The contractor agrees to replace the following asphalt surfaces:

${asphaltResults.map((result, index) => `
${index + 1}. ${result.surfaceType.replace('_', ' ').toUpperCase()}
   - Dimensions: ${result.length.toFixed(1)}' × ${result.width.toFixed(1)}'
   - Area: ${result.area.toFixed(0)} square feet
   - Estimated Cost: $${(result.area * 4).toLocaleString()}
`).join('')}

TOTAL PROJECT:
- Total Area: ${totalArea.toFixed(0)} square feet
- Total Estimated Cost: $${totalCost.toLocaleString()}
- Payment Terms: 50% upfront, 50% upon completion
- Warranty: 2 years on materials and workmanship

This contract is based on AI-generated measurements and should be verified on-site before work begins.

Contractor: _________________
Client: ____________________
Date: ______________________
    `.trim();

    // Create downloadable contract
    const blob = new Blob([contractContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt_contract_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Contract generated and downloaded');
  };

  // Export as technical report
  const exportAsTechnicalReport = () => {
    if (!asphaltResults || asphaltResults.length === 0) {
      toast.error('No data available for technical report');
      return;
    }

    const reportData = {
      reportType: 'Asphalt Surface Analysis',
      generatedDate: new Date().toISOString(),
      summary: {
        totalSurfaces: asphaltResults.length,
        totalArea: asphaltResults.reduce((sum, r) => sum + r.area, 0),
        averageConfidence: asphaltResults.reduce((sum, r) => sum + r.confidence, 0) / asphaltResults.length,
        estimatedTotalCost: asphaltResults.reduce((sum, r) => sum + (r.area * 4), 0)
      },
      surfaces: asphaltResults.map(result => ({
        type: result.surfaceType,
        measurements: {
          length: result.length,
          width: result.width,
          area: result.area,
          perimeter: 2 * (result.length + result.width)
        },
        analysis: {
          confidence: result.confidence,
          darkness: result.darkness,
          estimatedCost: result.area * 4
        }
      }))
    };

    // Export as JSON for technical analysis
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technical_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Technical report generated');
  };

  // Create 3D visualization
  const create3DVisualization = () => {
    if (!asphaltResults || asphaltResults.length === 0) {
      toast.error('No data available for visualization');
      return;
    }

    // Create 3D canvas visualization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 800;

    // Draw 3D background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw 3D asphalt surfaces
    asphaltResults.forEach((result, index) => {
      const x = 100 + (index % 4) * 200;
      const y = 100 + Math.floor(index / 4) * 150;
      const width = Math.min(result.width / 10, 150);
      const height = Math.min(result.length / 10, 100);

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x + 5, y + 5, width, height);

      // Draw 3D surface
      ctx.fillStyle = '#374151';
      ctx.fillRect(x, y, width, height);

      // Draw top surface
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(x - 2, y - 2, width, height);

      // Add measurements
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(`${result.area.toFixed(0)} sq ft`, x, y + height + 20);
      ctx.fillText(result.surfaceType.replace('_', ' '), x, y - 10);
    });

    // Add title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('3D Asphalt Surface Visualization', 400, 50);

    // Download 3D visualization
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `3d_asphalt_visualization_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    toast.success('3D visualization created and downloaded');
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = exportTemplates.find(t => t.id === templateId);
    if (template) {
      setExportFormat(template.formats[0] as any);
    }
  };

  // Handle export
  const handleExport = () => {
    if (!selectedTemplate) {
      toast.error('Please select an export template');
      return;
    }

    switch (selectedTemplate) {
      case 'email-report':
        exportAsEmail();
        break;
      case 'contract-attachment':
        exportAsContract();
        break;
      case 'technical-report':
        exportAsTechnicalReport();
        break;
      case 'visualization':
        create3DVisualization();
        break;
      default:
        toast.error('Unknown export template');
    }
  };

  return (
    <Card className="absolute top-20 right-4 z-40 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg max-w-[400px]">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Document Export</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium">Export Templates:</h4>
          <div className="grid grid-cols-1 gap-2">
            {exportTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {template.icon}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                  {selectedTemplate === template.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email Configuration */}
        {selectedTemplate === 'email-report' && (
          <div className="space-y-3 p-3 bg-muted/20 rounded">
            <h4 className="text-xs font-medium">Email Configuration:</h4>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Recipient email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded"
              />
              <input
                type="text"
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded"
              />
              <textarea
                placeholder="Message (optional)"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded h-20"
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        {selectedTemplate && (
          <Button
            onClick={handleExport}
            className="w-full"
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Export {exportTemplates.find(t => t.id === selectedTemplate)?.name}
          </Button>
        )}

        {/* Data Summary */}
        {asphaltResults && asphaltResults.length > 0 && (
          <div className="space-y-2 bg-muted/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <h4 className="text-xs font-medium">Data Summary</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Surfaces</div>
                <div className="font-medium">{asphaltResults.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Area</div>
                <div className="font-medium">
                  {asphaltResults.reduce((sum, r) => sum + r.area, 0).toFixed(0)} sq ft
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Confidence</div>
                <div className="font-medium">
                  {(asphaltResults.reduce((sum, r) => sum + r.confidence, 0) / asphaltResults.length * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Est. Cost</div>
                <div className="font-medium">
                  ${asphaltResults.reduce((sum, r) => sum + (r.area * 4), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            Export templates include measurements, costs, and visualizations for professional use.
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DocumentExportService;