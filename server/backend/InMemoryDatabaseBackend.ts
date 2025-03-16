import { formatDatabaseBackendKeys } from "engine/server/backend/DatabaseBackend";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

export class InMemoryDatabaseBackend<T> implements DatabaseBackend<T, defined[]> {
	private readonly data = new Map<string, T>();

	GetAsync(args: readonly defined[]): T | undefined {
		return this.data.get(formatDatabaseBackendKeys(args));
	}
	SetAsync(value: T, args: readonly defined[]): void {
		this.data.set(formatDatabaseBackendKeys(args), value);
	}
	RemoveAsync(args: readonly defined[]): void {
		this.data.delete(formatDatabaseBackendKeys(args));
	}
}
