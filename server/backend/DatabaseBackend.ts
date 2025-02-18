export const formatDatabaseBackendKeys = (keys: readonly defined[]) => keys.join("_");

export interface DatabaseBackend<T, TKeys extends defined[]> {
	GetAsync(keys: TKeys): T | undefined;
	SetAsync(value: T, keys: TKeys): void;
	RemoveAsync(keys: TKeys): void;
}
