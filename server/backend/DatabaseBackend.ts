export interface DatabaseBackend {
	GetAsync<T>(key: string): T | undefined;
	SetAsync(key: string, value?: unknown): void;
	RemoveAsync(key: string): void;
}
