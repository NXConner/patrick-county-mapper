import React, { useMemo, useState } from 'react';
import type { FreeMapContainerRef } from '@/components/Map/FreeMapContainer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PrintComposerProps {
	mapRef: React.MutableRefObject<FreeMapContainerRef | null>;
	onClose: () => void;
}

const northArrowSvg = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,5 65,60 50,50 35,60" fill="#111827" />
  <text x="50" y="90" text-anchor="middle" font-size="24" fill="#111827" font-family="Arial">N</text>
</svg>`;

const PrintComposer: React.FC<PrintComposerProps> = ({ mapRef, onClose }) => {
	const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal' | 'tabloid'>('letter');
	const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
	const [dpi, setDpi] = useState<number>(150);
	const [includeLegend, setIncludeLegend] = useState<boolean>(true);
	const [includeScale, setIncludeScale] = useState<boolean>(true);
	const [includeNorth, setIncludeNorth] = useState<boolean>(true);

	const scaleFactor = useMemo(() => Math.max(1, dpi / 96), [dpi]);

	const captureAndCompose = async (): Promise<string> => {
		const el = mapRef.current?.getMapContainerElement?.();
		if (!el) throw new Error('Map container not available');
		const map = mapRef.current?.getMap?.();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore dynamic import
		const { default: html2canvas } = await import('html2canvas');
		const canvas = await html2canvas(el, { scale: scaleFactor, useCORS: true, backgroundColor: null });
		const ctx = canvas.getContext('2d');
		if (!ctx) return canvas.toDataURL('image/jpeg', 0.92);

		// Draw legend
		if (includeLegend) {
			const legendX = 16 * scaleFactor;
			const legendY = 16 * scaleFactor;
			const legendW = 220 * scaleFactor;
			const legendH = 100 * scaleFactor;
			ctx.fillStyle = 'rgba(255,255,255,0.85)';
			ctx.strokeStyle = 'rgba(0,0,0,0.15)';
			ctx.lineWidth = 1 * scaleFactor;
			ctx.fillRect(legendX, legendY, legendW, legendH);
			ctx.strokeRect(legendX, legendY, legendW, legendH);
			ctx.fillStyle = '#111827';
			ctx.font = `${12 * scaleFactor}px Arial`;
			ctx.fillText('Legend', legendX + 10 * scaleFactor, legendY + 20 * scaleFactor);
			// Minimal legend entries
			ctx.fillText('• Satellite', legendX + 10 * scaleFactor, legendY + 40 * scaleFactor);
			ctx.fillText('• Roads', legendX + 10 * scaleFactor, legendY + 58 * scaleFactor);
			ctx.fillText('• Labels', legendX + 10 * scaleFactor, legendY + 76 * scaleFactor);
		}

		// Draw scale bar (feet)
		if (includeScale && map) {
			const width = canvas.width;
			const height = canvas.height;
			const p1 = map.containerPointToLatLng([width - 180 * scaleFactor, height - 30 * scaleFactor] as any);
			const p2 = map.containerPointToLatLng([width - 30 * scaleFactor, height - 30 * scaleFactor] as any);
			const meters = p1 && p2 ? p1.distanceTo(p2) : 0;
			const feet = meters * 3.28084;
			// Choose a nice round bar length
			const nice = [50, 100, 200, 500, 1000, 2000];
			const target = nice.find((n) => n < feet) || 100;
			const pxPerFoot = (150 * scaleFactor) / feet;
			const barPx = target * pxPerFoot;
			const x = width - (barPx + 40 * scaleFactor);
			const y = height - 40 * scaleFactor;
			ctx.fillStyle = 'rgba(255,255,255,0.85)';
			ctx.fillRect(x - 10 * scaleFactor, y - 18 * scaleFactor, barPx + 20 * scaleFactor, 28 * scaleFactor);
			ctx.strokeStyle = '#111827';
			ctx.lineWidth = 2 * scaleFactor;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + barPx, y);
			ctx.stroke();
			ctx.fillStyle = '#111827';
			ctx.font = `${12 * scaleFactor}px Arial`;
			ctx.fillText(`${target} ft`, x + barPx / 2 - 16 * scaleFactor, y - 6 * scaleFactor);
		}

		// Draw north arrow
		if (includeNorth) {
			const size = 48 * scaleFactor;
			const img = new Image();
			img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(northArrowSvg(100));
			await new Promise<void>((res) => { img.onload = () => res(); });
			ctx.drawImage(img, canvas.width - size - 16 * scaleFactor, 16 * scaleFactor, size, size);
		}

		return canvas.toDataURL('image/jpeg', 0.92);
	};

	const exportPng = async () => {
		try {
			const dataUrl = await captureAndCompose();
			const link = document.createElement('a');
			link.href = dataUrl;
			link.download = `map-export-${Date.now()}.jpg`;
			link.click();
		} catch (e) {
			toast.error('PNG export failed');
		}
	};

	const exportPdf = async () => {
		try {
			const dataUrl = await captureAndCompose();
			const { jsPDF } = await import('jspdf');
			const pdf = new jsPDF(orientation, 'mm', pageSize);
			const pageW = pdf.internal.pageSize.getWidth();
			const pageH = pdf.internal.pageSize.getHeight();
			const margin = 10;
			const imgW = pageW - margin * 2;
			const imgH = pageH - margin * 2;
			pdf.addImage(dataUrl, 'JPEG', margin, margin, imgW, imgH);
			pdf.save(`map-export-${Date.now()}.pdf`);
			toast.success('PDF exported');
		} catch (e) {
			toast.error('PDF export failed');
		}
	};

	return (
		<div className="absolute top-16 right-4 z-50 bg-gis-toolbar text-foreground rounded-lg p-4 shadow-floating w-80">
			<div className="font-semibold mb-2">Print Composer</div>
			<div className="space-y-2 text-xs">
				<div className="flex items-center justify-between">
					<label>Page</label>
					<select className="bg-background border rounded px-2 py-1" value={pageSize} onChange={(e) => setPageSize(e.target.value as any)}>
						<option value="letter">Letter</option>
						<option value="a4">A4</option>
						<option value="legal">Legal</option>
						<option value="tabloid">Tabloid</option>
					</select>
				</div>
				<div className="flex items-center justify-between">
					<label>Orientation</label>
					<select className="bg-background border rounded px-2 py-1" value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
						<option value="portrait">Portrait</option>
						<option value="landscape">Landscape</option>
					</select>
				</div>
				<div className="flex items-center justify-between">
					<label>DPI</label>
					<select className="bg-background border rounded px-2 py-1" value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
						<option value={96}>96</option>
						<option value={150}>150</option>
						<option value={300}>300</option>
					</select>
				</div>
				<div className="grid grid-cols-3 gap-2">
					<label className="flex items-center gap-2"><input type="checkbox" checked={includeLegend} onChange={(e) => setIncludeLegend(e.target.checked)} />Legend</label>
					<label className="flex items-center gap-2"><input type="checkbox" checked={includeScale} onChange={(e) => setIncludeScale(e.target.checked)} />Scale</label>
					<label className="flex items-center gap-2"><input type="checkbox" checked={includeNorth} onChange={(e) => setIncludeNorth(e.target.checked)} />North</label>
				</div>
				<div className="flex gap-2 pt-2">
					<Button size="sm" onClick={exportPng}>Export PNG</Button>
					<Button size="sm" variant="secondary" onClick={exportPdf}>Export PDF</Button>
					<Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
				</div>
			</div>
		</div>
	);
};

export default PrintComposer;

