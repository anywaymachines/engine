import { Objects } from "engine/shared/fixes/Objects";

/** A lazily evaluated value. */
export class Lazy<T> {
	private value?: T;
	private loading?: Promise<T>;
	private isLoaded = false;

	constructor(private readonly load: () => T) {}

	get(): T {
		if (this.isLoaded) {
			if (this.loading) {
				return Objects.awaitThrow(this.loading);
			}

			return this.value!;
		}

		this.loading = Promise.try(this.load);
		this.value = Objects.awaitThrow(this.loading);
		this.isLoaded = true;
		this.loading = undefined;

		return this.value;
	}
}
