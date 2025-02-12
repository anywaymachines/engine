import { formatDatabaseBackendKeys } from "engine/server/backend/DatabaseBackend";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

export class InMemoryDatabaseBackend implements DatabaseBackend<defined[]> {
	private readonly data = new Map<string, string>();

	GetAsync(args: readonly defined[]): string | undefined {
		return this.data.get(formatDatabaseBackendKeys(args));
	}
	SetAsync(value: string | undefined, args: readonly defined[]): void {
		this.data.set(formatDatabaseBackendKeys(args), value!);
	}
	RemoveAsync(args: readonly defined[]): void {
		this.data.delete(formatDatabaseBackendKeys(args));
	}
}
