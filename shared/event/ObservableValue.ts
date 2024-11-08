import { Signal } from "engine/shared/event/Signal";

class _ObservableValue<T> {
	readonly changed = new Signal<(value: T, prev: T) => void>();
	private value: T;
	private readonly _middleware?: (value: T) => T;

	constructor(value: T, middleware?: (value: T) => T) {
		this.value = value;
		this._middleware = middleware;
	}

	set(value: T) {
		if (this._middleware) {
			value = this._middleware(value);
		}

		if (this.value === value) return;
		const prev = this.get();

		this.value = value;
		this.changed.Fire(value, prev);
	}

	get() {
		return this.value;
	}
}

/** Stores a value and provides and event of it being changed */
export const ObservableValue = _ObservableValue as unknown as new <T>(
	value: T,
	middleware?: (value: T) => T,
) => ObservableValue<T>;
