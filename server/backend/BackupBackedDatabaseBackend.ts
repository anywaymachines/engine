import { DataStoreDatabaseBackend } from "engine/server/backend/DataStoreDatabaseBackend";
import { Element } from "engine/shared/Element";
import { JSON } from "engine/shared/fixes/Json";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

const getOptions = Element.create("DataStoreGetOptions", { UseCache: false });
type BackupValue<T, TKeys extends defined[]> = {
	readonly keys: TKeys;
	readonly value: T | undefined;
};

export class BackupBackedDatabaseBackend<T, TKeys extends defined[]> implements DatabaseBackend<T, TKeys> {
	private mainUnavailable = false;
	private readonly backup: DatabaseBackend<BackupValue<T, TKeys>, TKeys>;

	constructor(
		private readonly main: DatabaseBackend<T, TKeys>,
		private readonly backupDatastore: DataStore,
	) {
		this.backup = new DataStoreDatabaseBackend(backupDatastore);

		task.spawn(() => {
			while (true as boolean) {
				try {
					this.uploadBackup();
				} catch {
					// empty
				}

				task.wait(60 * 60);
			}
		});
	}

	private uploadBackup() {
		const pages = this.backupDatastore.ListKeysAsync(undefined, undefined, undefined, true);
		while (true as boolean) {
			const keys = pages.GetCurrentPage() as DataStoreKey[];
			if (keys.isEmpty()) break;

			for (const { KeyName: dsKey } of keys) {
				const [bv] = this.backupDatastore.GetAsync(dsKey, getOptions);
				if (bv === undefined) {
					$log(`Skipping ${dsKey} ???`);
					continue;
				}

				$log(`Uploading ${this.backupDatastore.Name} ${dsKey} from backup...`);
				const { keys, value } = JSON.deserialize<BackupValue<T, TKeys>>(bv as string);
				if (value === undefined) {
					this.main.RemoveAsync(keys);
				} else {
					this.main.SetAsync(value, keys);
				}

				this.backupDatastore.RemoveAsync(dsKey);
			}

			pages.AdvanceToNextPageAsync();
		}
	}

	GetAsync(keys: TKeys): T | undefined {
		try {
			const ret = this.main.GetAsync(keys);
			if (this.mainUnavailable) {
				this.mainUnavailable = false;
				this.uploadBackup();
			}

			return ret;
		} catch (err) {
			this.mainUnavailable = true;
			throw err;
		}
	}
	SetAsync(value: T, keys: TKeys): void {
		try {
			this.main.SetAsync(value, keys);
			this.mainUnavailable = false;
		} catch (err) {
			this.mainUnavailable = true;
			$warn(`Error setting to main db backend: ${err}, setting to backup`);
			this.backup.SetAsync({ value, keys }, keys);
		}
	}
	RemoveAsync(keys: TKeys): void {
		try {
			this.main.RemoveAsync(keys);
			this.mainUnavailable = false;
		} catch (err) {
			this.mainUnavailable = true;
			$warn(`Error removing from main db backend: ${err}, removing from backup`);
			this.backup.SetAsync({ value: undefined, keys }, keys);
		}
	}
}
