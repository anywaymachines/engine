import { DataStoreService } from "@rbxts/services";
import { formatDatabaseBackendKeys } from "engine/server/backend/DatabaseBackend";
import { Element } from "engine/shared/Element";
import { JSON } from "engine/shared/fixes/Json";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

const getOptions = Element.create("DataStoreGetOptions", { UseCache: false });

export class DataStoreDatabaseBackend<T> implements DatabaseBackend<T, defined[]> {
	static tryCreate<T>(name: string): DataStoreDatabaseBackend<T> | undefined {
		try {
			return new DataStoreDatabaseBackend(DataStoreService.GetDataStore(name));
		} catch {
			return undefined;
		}
	}

	constructor(private readonly dataStore: DataStore) {}

	GetAsync(keys: defined[]): T | undefined {
		const str = this.dataStore.GetAsync<string>(formatDatabaseBackendKeys(keys), getOptions)[0];
		return str ? (JSON.deserialize(str) as T) : undefined;
	}
	SetAsync(value: T | undefined, keys: defined[]): void {
		this.dataStore.SetAsync(formatDatabaseBackendKeys(keys), JSON.serialize(value));
	}
	RemoveAsync(keys: defined[]): void {
		this.dataStore.RemoveAsync(formatDatabaseBackendKeys(keys));
	}
}
