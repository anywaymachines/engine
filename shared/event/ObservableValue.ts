import { Signal } from "engine/shared/event/Signal";

export interface ReadonlyObservableValueBase<out T> {
	readonly changed: ReadonlyArgsSignal<[value: T]>;

	get(): T;
}
export interface ObservableValueBase<T> extends ReadonlyObservableValueBase<T> {
	set(value: T, forceSet?: boolean): void;
	destroy(): void;
}

export interface ReadonlyObservableValue<T> extends ReadonlyObservableValueBase<T> {}
export interface ObservableValue<T> extends ReadonlyObservableValue<T>, ObservableValueBase<T> {}

export const isReadonlyObservableValue = (v: unknown): v is ReadonlyObservableValue<unknown> =>
	typeIs(v, "table") && "get" in v && "changed" in v;

class _ObservableValue<T> implements ObservableValueBase<T> {
	readonly changed = new Signal<(value: T) => void>();
	private value: T;
	private readonly _middleware?: (newval: T, current: T) => T;

	constructor(value: T, middleware?: (newval: T, current: T) => T) {
		this.value = value;
		this._middleware = middleware;
	}

	set(value: T) {
		if (this._middleware) {
			value = this._middleware(value, this.get());
		}

		if (this.value === value) return;

		this.value = value;
		this.changed.Fire(value);
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
	middleware?: (newval: T, current: T) => T,
) => ObservableValue<T>;
