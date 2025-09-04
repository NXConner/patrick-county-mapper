// Minimal offline tile pack downloader using Cache Storage

const TILE_CACHE = 'tiles-pack';

export interface TilePackRequest {
	templateUrl: string; // e.g. https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
	bounds: [[number, number], [number, number]]; // [[south, west],[north, east]]
	zoomRange: [number, number];
}

export class OfflineTilePacks {
	static async downloadPack(req: TilePackRequest, onProgress?: (done: number, total: number) => void): Promise<void> {
		const cache = await caches.open(TILE_CACHE);
		const [minZoom, maxZoom] = req.zoomRange;
		const [southWest, northEast] = req.bounds;
		const totalTiles: string[] = [];
		for (let z = minZoom; z <= maxZoom; z++) {
			const minX = Math.floor(((southWest[1] + 180) / 360) * Math.pow(2, z));
			const maxX = Math.floor(((northEast[1] + 180) / 360) * Math.pow(2, z));
			const minY = Math.floor((1 - Math.log(Math.tan((southWest[0] * Math.PI) / 180) + 1 / Math.cos((southWest[0] * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, z));
			const maxY = Math.floor((1 - Math.log(Math.tan((northEast[0] * Math.PI) / 180) + 1 / Math.cos((northEast[0] * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, z));
			for (let x = minX; x <= maxX; x++) {
				for (let y = minY; y <= maxY; y++) {
					totalTiles.push(req.templateUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)));
				}
			}
		}
		let done = 0;
		for (const url of totalTiles) {
			try {
				const res = await fetch(url, { mode: 'no-cors' });
				await cache.put(url, res.clone());
			} catch {}
			done++;
			onProgress?.(done, totalTiles.length);
		}
	}
}

export default OfflineTilePacks;

