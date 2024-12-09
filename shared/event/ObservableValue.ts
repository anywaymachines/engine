import { Signal } from "engine/shared/event/Signal";

export interface ReadonlyObservableValueBase<T> {
	readonly changed: ReadonlyArgsSignal<[value: T, prev: T]>;

	get(): T;
}
export interface ObservableValueBase<T> extends ReadonlyObservableValueBase<T> {
	set(value: T, forceSet?: boolean): void;
	destroy(): void;
}

export interface ReadonlyObservableValue<T> extends ReadonlyObservableValueBase<T> {}
export interface ObservableValue<T> extends ReadonlyObservableValue<T>, ObservableValueBase<T> {}

class _ObservableValue<T> implements ObservableValueBase<T> {
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

	destroy(): void {
		this.changed.destroy();
	}
}

/** Stores a value and provides and event of it being changed */
export const ObservableValue = _ObservableValue as unknown as new <T>(
	value: T,
	middleware?: (value: T) => T,
) => ObservableValue<T>;
