import { supabase } from '@/integrations/supabase/client';
import { idbGet, idbSet } from '@/lib/idbCache';

export interface WorkspaceState {
	name: string;
	createdAt: string;
	map: {
		center: [number, number];
		zoom: number;
		mapService: string;
		layerStates: Record<string, boolean>;
	};
	drawings: GeoJSON.FeatureCollection | null;
}

const IDB_KEY_PREFIX = 'workspace:';

export class WorkspaceService {
	static async save(state: WorkspaceState): Promise<void> {
		// Try Supabase first
		try {
			await supabase.from('workspaces').upsert({
				name: state.name,
				payload: state as unknown as Record<string, unknown>,
				updated_at: new Date().toISOString(),
			}).throwOnError();
			return;
		} catch {}

		// Fallback to IndexedDB
		await idbSet(`${IDB_KEY_PREFIX}${state.name}`, state);
	}

	static async load(name: string): Promise<WorkspaceState | null> {
		try {
			const { data, error } = await supabase
				.from('workspaces')
				.select('payload')
				.eq('name', name)
				.single();
			if (!error && data && data.payload) {
				return data.payload as unknown as WorkspaceState;
			}
		} catch {}

		const local = await idbGet(`${IDB_KEY_PREFIX}${name}`);
		return (local as WorkspaceState) || null;
	}
}

export default WorkspaceService;

