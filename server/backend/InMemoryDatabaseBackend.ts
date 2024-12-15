import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

export class InMemoryDatabaseBackend implements DatabaseBackend {
	private readonly data = new Map<string, unknown>();

	GetAsync<T>(key: string): T | undefined {
		return this.data.get(key) as T;
	}
	SetAsync(key: string, value?: unknown): void {
		this.data.set(key, value);
	}
	RemoveAsync(key: string): void {
		this.data.delete(key);
	}
}
