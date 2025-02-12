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
abstract class DbBase<T, TKeys extends defined[]> {
	private readonly cache: { [k in string]: DbStoredValue<T, TKeys> } = {};
	private readonly currentlyLoading: Record<string, Promise<T>> = {};

	constructor(private readonly datastore: DatabaseBackend<TKeys>) {
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
	protected abstract deserialize(data: string): T;
	protected abstract serialize(data: T): string | undefined;

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
		this.cache[formatDatabaseBackendKeys(keys)] = {
			keys,
			changed: true,
			lastAccessedTime: time,
			value,
			lastSaveTime: time,
		};
	}

	private load(keys: TKeys, strkey: string): DbStoredValue<T, TKeys> {
		const req = Throttler.retryOnFail<string | undefined>(10, 1, () => this.datastore!.GetAsync(keys));

		if (req.success) {
			if (req.message !== undefined) {
				const time = os.time();
				return (this.cache[strkey] = {
					keys,
					value: this.deserialize(req.message),
					changed: false,
					lastAccessedTime: time,
					lastSaveTime: time,
				});
			}
		} else {
			$err(req.error_message);
		}

		const time = os.time();
		return {
			keys,
			value: this.createDefault(),
			changed: false,
			lastAccessedTime: time,
			lastSaveTime: time,
		};
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

		const req = Throttler.retryOnFail(10, 1, () => this.datastore!.SetAsync(this.serialize(value.value), keys));
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

export class Db<T, TKeys extends defined[]> extends DbBase<T, TKeys> {
	constructor(
		datastore: DatabaseBackend<TKeys>,
		private readonly createDefaultFunc: () => T,
		private readonly serializeFunc: (data: T) => string | undefined,
		private readonly deserializeFunc: (data: string) => T,
	) {
		super(datastore);
	}

	protected createDefault(): T {
		return this.createDefaultFunc();
	}

	protected deserialize(data: string): T {
		return this.deserializeFunc(data);
	}

	protected serialize(data: T): string | undefined {
		return this.serializeFunc(data);
	}
}
