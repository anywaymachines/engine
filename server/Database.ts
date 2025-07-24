import { formatDatabaseBackendKeys } from "engine/server/backend/DatabaseBackend";
import { Objects } from "engine/shared/fixes/Objects";
import { Throttler } from "engine/shared/Throttler";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

interface DbStoredValue<T, TKeys extends defined[]> {
	keys: TKeys;
	value: T;
	changed: boolean;
	lastAccessedTime: number;
	lastSaveTime: number;
}
abstract class DbBase<T, TDb, TKeys extends defined[]> {
	private readonly cache: { [k in string]: DbStoredValue<T, TKeys> } = {};
	private readonly currentlyLoading: Record<string, Promise<T>> = {};

	constructor(private readonly datastore: DatabaseBackend<TDb, TKeys>) {
		game.BindToClose(() => {
			$log("Game termination detected");

			this.saveChanged();
			this.freeAll();
		});

		task.spawn(() => {
			const freeTimeoutSec = 5 * 60;
			const saveTimeoutSec = 9 * 60;
			$debug(`Initializing db ${this} cache auto-freeing after ${freeTimeoutSec} sec of inactivity`);
			$debug(`Initializing db ${this} cache auto-saving with the interval of ${saveTimeoutSec} sec`);

			while (true as boolean) {
				task.wait(1);

				const freeTimeCutoff = os.time() - freeTimeoutSec;
				const saveTimeCutoff = os.time() - saveTimeoutSec;

				for (const [key, item] of [...asMap(this.cache)]) {
					if (item.lastAccessedTime < freeTimeCutoff) {
						$debug(`Freeing db ${this} key ${key} after ${freeTimeoutSec} sec of inactivity`);

						this.save(item.keys, key);
						this.free(item.keys, key);
						continue;
					}

					if (item.lastSaveTime < saveTimeCutoff) {
						$debug(`Auto-saving db ${this} key ${key} after ${saveTimeoutSec} sec`);
						this.save(item.keys, key);
					}
				}
			}
		});
	}

	protected abstract createDefault(): T;
	protected abstract import(value: TDb): T;
	protected abstract export(value: T): TDb;

	get(keys: TKeys): T {
		const strkey = formatDatabaseBackendKeys(keys);
		if (strkey in this.cache) {
			const value = this.cache[strkey];
			value.lastAccessedTime = os.time();

			return value.value;
		}

		if (strkey in this.currentlyLoading) {
			return Objects.awaitThrow(this.currentlyLoading[strkey]);
		}

		let res: (value: T) => void = undefined!;
		const promise = new Promise<T>((resolve) => (res = resolve));
		this.currentlyLoading[strkey] = promise;

		try {
			const loaded = this.load(keys, strkey);
			this.cache[strkey] = loaded;
			res(loaded.value);

			return loaded.value;
		} finally {
			delete this.currentlyLoading[strkey];
		}
	}

	set(keys: TKeys, value: T) {
		const time = os.time();
		const key = formatDatabaseBackendKeys(keys);
		this.cache[key] = {
			keys,
			changed: true,
			lastAccessedTime: time,
			value,
			lastSaveTime: time,
		};
		this.save(keys, key);
	}
	delete(keys: TKeys) {
		this.datastore.RemoveAsync(keys);
		this.free(keys);
	}

	private load(keys: TKeys, strkey: string): DbStoredValue<T, TKeys> {
		const req = Throttler.retryOnFail<TDb | undefined>(3, 1, () => this.datastore!.GetAsync(keys));
		if (!req.success) {
			throw req.error_message;
		}

		if (req.message !== undefined) {
			const time = os.time();
			return (this.cache[strkey] = {
				keys,
				value: this.import(req.message),
				changed: false,
				lastAccessedTime: time,
				lastSaveTime: time,
			});
		}

		const time = os.time();
		return (this.cache[strkey] = {
			keys,
			value: this.createDefault(),
			changed: false,
			lastAccessedTime: time,
			lastSaveTime: time,
		});
	}

	loadedUnsavedEntries() {
		return Objects.entriesArray(this.cache).filter((entry) => entry[1].changed);
	}

	/** Removes an entry from the cache */
	free(keys: TKeys, key?: string) {
		delete this.cache[key ?? formatDatabaseBackendKeys(keys)];
	}

	/** Clears tha cache */
	freeAll() {
		for (const [key, _] of pairs(this.cache)) {
			delete this.cache[key];
		}
	}

	/** Saves an entry if it's not changed */
	save(keys: TKeys, strkey?: string) {
		strkey ??= formatDatabaseBackendKeys(keys);

		const value = this.cache[strkey];
		if (!value) return;

		value.lastSaveTime = os.time();
		if (!value.changed) return;

		// delay between saves?
		value.changed = false;

		const req = Throttler.retryOnFail(3, 1, () => this.datastore!.SetAsync(this.export(value.value), keys));
		if (!req.success) {
			$err(req.error_message);
		}
	}

	saveChanged() {
		for (const [key, { keys }] of pairs(this.cache)) {
			this.save(keys, key);
		}
	}
}

export class Db<T, TDb, TKeys extends defined[]> extends DbBase<T, TDb, TKeys> {
	constructor(
		datastore: DatabaseBackend<TDb, TKeys>,
		private readonly createDefaultFunc: () => T,
		private readonly importFunc: (value: TDb) => T,
		private readonly exportFunc: (value: T) => TDb,
	) {
		super(datastore);
	}

	protected createDefault(): T {
		return this.createDefaultFunc();
	}
	protected import(value: TDb): T {
		return this.importFunc(value);
	}
	protected export(value: T): TDb {
		return this.exportFunc(value);
	}
}
