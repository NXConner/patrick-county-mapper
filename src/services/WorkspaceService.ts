import { supabase } from '@/integrations/supabase/client';
import { idbGet, idbSet } from '@/lib/idbCache';
import { WorkspaceVersionsService } from './WorkspaceVersionsService';

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
const IDB_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export class WorkspaceService {
    static async upsert(name: string, payload: Record<string, unknown>): Promise<void> {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Not authenticated');
        await supabase
            .from('workspaces')
            .upsert({ name, payload, created_by: user.id }, { onConflict: 'name' as any })
            .throwOnError();
    }
	static async save(state: WorkspaceState): Promise<void> {
		// Try Supabase first
		try {
			await supabase.from('workspaces').upsert({
				name: state.name,
				payload: state as unknown as Record<string, unknown>,
				updated_at: new Date().toISOString(),
			}).throwOnError();
			// Create a version entry
			await WorkspaceVersionsService.createVersion(state.name, state);
			return;
		} catch {
			// enqueue upsert offline
			try {
				const { OfflineQueueService } = await import('./OfflineQueueService');
				await OfflineQueueService.enqueue({ id: crypto.randomUUID(), type: 'workspace_upsert', payload: { name: state.name, payload: state, updated_at: new Date().toISOString() }, createdAt: Date.now() });
			} catch {}
		}

		// Fallback to IndexedDB
		await idbSet(`${IDB_KEY_PREFIX}${state.name}`, state, IDB_TTL_MS);
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

