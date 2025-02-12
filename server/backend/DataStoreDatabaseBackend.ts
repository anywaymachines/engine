import { DataStoreService } from "@rbxts/services";
import { formatDatabaseBackendKeys } from "engine/server/backend/DatabaseBackend";
import { Element } from "engine/shared/Element";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

const getOptions = Element.create("DataStoreGetOptions", { UseCache: false });

export class DataStoreDatabaseBackend implements DatabaseBackend<defined[]> {
	static tryCreate(name: string): DataStoreDatabaseBackend | undefined {
		try {
			return new DataStoreDatabaseBackend(DataStoreService.GetDataStore(name));
		} catch {
			return undefined;
		}
	}

	constructor(private readonly dataStore: DataStore) {}

	GetAsync(keys: defined[]): string | undefined {
		return this.dataStore.GetAsync<string>(formatDatabaseBackendKeys(keys), getOptions)[0];
	}
	SetAsync(value: string | undefined, keys: defined[]): void {
		this.dataStore.SetAsync(formatDatabaseBackendKeys(keys), value);
	}
	RemoveAsync(keys: defined[]): void {
		this.dataStore.RemoveAsync(formatDatabaseBackendKeys(keys));
	}
}
