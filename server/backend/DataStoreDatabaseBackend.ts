import { DataStoreService } from "@rbxts/services";
import { Element } from "engine/shared/Element";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

const getOptions = Element.create("DataStoreGetOptions", { UseCache: false });

export class DataStoreDatabaseBackend implements DatabaseBackend {
	static tryCreate(name: string): DataStoreDatabaseBackend | undefined {
		try {
			return new DataStoreDatabaseBackend(DataStoreService.GetDataStore(name));
		} catch {
			return undefined;
		}
	}

	constructor(private readonly dataStore: DataStore) {}

	GetAsync<T>(key: string): T | undefined {
		return this.dataStore.GetAsync<T>(key, getOptions)[0];
	}
	SetAsync(key: string, value?: unknown): void {
		this.dataStore.SetAsync(key, value);
	}
	RemoveAsync(key: string): void {
		this.dataStore.RemoveAsync(key);
	}
}
