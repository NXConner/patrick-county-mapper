// Lightweight worker to generate PDF using jsPDF without blocking the UI thread

export interface ExportOptions {
	format: 'png' | 'pdf' | 'email' | 'print' | 'contract' | 'report';
	includeMap?: boolean;
	includeWhiteBackground?: boolean;
	includeMetadata?: boolean;
	resolution?: 'low' | 'medium' | 'high' | 'print';
	orientation?: 'portrait' | 'landscape';
	pageSize?: 'a4' | 'letter' | 'legal' | 'tabloid';
}

export interface AsphaltRegion {
	surfaceType: string;
	length: number;
	width: number;
	area: number;
	confidence: number;
	polygon: number[][];
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

type WorkerRequest = {
	type: 'generate-pdf';
	data: AsphaltAnalysisData;
	options: Partial<ExportOptions>;
};

type WorkerResponse =
	| { ok: true; buffer: ArrayBuffer }
	| { ok: false; error: string };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const { type, data, options } = event.data || {} as WorkerRequest;
	if (type !== 'generate-pdf') return;

	try {
		const { jsPDF } = await import('jspdf');
		const pdf = new jsPDF(
			(options.orientation || 'landscape') as 'portrait' | 'landscape',
			'mm',
			(options.pageSize || 'a4') as 'a4' | 'letter' | 'legal' | 'tabloid'
		);

		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();

		// Title
		pdf.setFontSize(20);
		pdf.text('Asphalt Analysis Report', pageWidth / 2, 20, { align: 'center' });

		// Analysis date
		pdf.setFontSize(12);
		pdf.text(`Analysis Date: ${new Date(data.analysisDate).toLocaleDateString()}`, 20, 35);

		// Summary
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
		summaryData.forEach((line) => {
			yPos += 8;
			pdf.text(line, 20, yPos);
		});

		// Table header
		yPos += 20;
		pdf.setFontSize(16);
		pdf.text('Detailed Analysis', 20, yPos);
		yPos += 10;
		pdf.setFontSize(10);
		const headers = ['Type', 'Length (ft)', 'Width (ft)', 'Area (sq ft)', 'Confidence'];
		const colWidths = [40, 30, 30, 35, 30];
		let xPos = 20;
		headers.forEach((h, i) => { pdf.text(h, xPos, yPos); xPos += colWidths[i]; });
		yPos += 5;
		pdf.line(20, yPos, pageWidth - 20, yPos);

		for (const surface of data.surfaces) {
			yPos += 8;
			if (yPos > pageHeight - 30) {
				pdf.addPage();
				yPos = 30;
			}
			xPos = 20;
			const row = [
				surface.surfaceType.replace('_', ' '),
				surface.length.toFixed(1),
				surface.width.toFixed(1),
				surface.area.toFixed(0),
				`${(surface.confidence * 100).toFixed(1)}%`
			];
			row.forEach((v, i) => { pdf.text(String(v), xPos, yPos); xPos += colWidths[i]; });
		}

		if (options.includeMap && data.mapImageData) {
			pdf.addPage();
			pdf.setFontSize(16);
			pdf.text('Satellite Analysis', 20, 20);
			try {
				const imgWidth = pageWidth - 40;
				const imgHeight = (pageHeight - 60) * 0.7;
				pdf.addImage(data.mapImageData, 'JPEG', 20, 35, imgWidth, imgHeight);
			} catch {}
		}

		const arrayBuffer = pdf.output('arraybuffer') as ArrayBuffer;
		const response: WorkerResponse = { ok: true, buffer: arrayBuffer };
		// Transfer ownership of the ArrayBuffer to avoid copying
		postMessage(response, { transfer: [arrayBuffer] as unknown as Transferable[] });
	} catch (err: unknown) {
		const response: WorkerResponse = { ok: false, error: (err as Error)?.message ?? 'PDF generation failed' };
		postMessage(response);
	}
};

