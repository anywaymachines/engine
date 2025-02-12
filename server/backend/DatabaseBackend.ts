export const formatDatabaseBackendKeys = (keys: readonly defined[]) => keys.join("_");

export interface DatabaseBackend<TKeys extends defined[]> {
	GetAsync(keys: TKeys): string | undefined;
	SetAsync(value: string | undefined, keys: TKeys): void;
	RemoveAsync(keys: TKeys): void;
}
