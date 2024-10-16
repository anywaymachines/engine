import { Signal } from "engine/shared/event/Signal";
import type { ReadonlySignal } from "engine/shared/event/Signal";

/** Stores a value and provides and event of it being changed */
export class ObservableValue<T> implements ReadonlyObservableValue<T> {
	private readonly _changed = new Signal<(value: T, prev: T) => void>();
	readonly changed = this._changed.asReadonly();

	private value: T;

	constructor(value: T) {
		this.value = value;
	}

	set(value: T, forceSet = false) {
		value = this.processValue(value);

		if (!forceSet && this.value === value) return;
		const prev = this.get();

		this.value = value;
		this._changed.Fire(value, prev);
	}

	get() {
		return this.value;
	}

	triggerChanged() {
		this.set(this.value, true);
	}

	/** Function that modifies the value before it gets stored */
	protected processValue(value: T) {
		return value;
	}

	/** Subscribes to the value changed event */
	subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean = false) {
		const sub = this.changed.Connect(func);

		if (executeImmediately) {
			func(this.get(), this.get());
		}

		return sub;
	}

	/** Automatically sets the provided ObservableValue value to the current one. */
	autoSet(observable: ObservableValue<T>, funcProvider?: (value: T) => T) {
		this.subscribe((value) => observable.set(funcProvider === undefined ? value : funcProvider(value)), true);
	}

	/** Binds to the other ObservableValue, making their values to share their value and events. */
	bindTo(observable: ObservableValue<T>) {
		this.subscribe((value) => observable.set(value));
		observable.subscribe((value) => this.set(value), true);
	}

	createChild<TKey extends keyof NonNullable<T>>(key: TKey, def: NonNullable<T>[TKey]) {
		const observable = new ObservableValue(this.value?.[key] ?? def);
		this.subscribe((value) => observable.set(value?.[key] ?? def));
		observable.subscribe((value) => {
			if (this.value !== undefined) {
				this.value![key] = value;
				this.set(this.value, true);
			}
		});

		return observable;
	}
	createNullableChild<TKey extends keyof NonNullable<T>>(
		key: TKey,
		def: NonNullable<T>[TKey] | undefined,
	): ReadonlyObservableValue<NonNullable<T>[TKey] | undefined> {
		const observable = new ObservableValue<NonNullable<T>[TKey] | undefined>(this.value?.[key] ?? def);
		this.subscribe((value) => observable.set(value?.[key] ?? def));

		return observable;
	}
	createBased<TNew>(func: (value: T) => TNew): ReadonlyObservableValue<TNew> {
		const observable = new ObservableValue<TNew>(func(this.get()));
		this.subscribe((value) => observable.set(func(value)));

		return observable;
	}

	asReadonly(): ReadonlyObservableValue<T> {
		return this;
	}

	withDefault(defval: T & defined): ObservableValue<T & defined> {
		const observable = new ObservableValue<T & defined>(this.get() ?? defval);
		this.subscribe((val) => observable.set(val ?? defval));
		observable.subscribe((val) => this.set(val));

		return observable;
	}

	waitUntil<U extends T>(func: (value: T) => value is U): U {
		let ret: U;
		let returned = false;
		const connection = this.subscribe((value) => {
			if (!func(value)) return;

			ret = value;
			returned = true;
			connection.Disconnect();
		});

		while (!returned) {
			task.wait();
		}

		return ret!;
	}

	static fromSignal<TSignal extends ReadonlySignal<(arg: unknown) => void>>(
		signal: TSignal,
		defaultValue: TSignal extends ReadonlySignal<(arg: infer T) => void> ? T : never,
	) {
		const observable = new ObservableValue(defaultValue);
		signal.Connect((arg) => observable.set(arg as typeof defaultValue));

		return observable;
	}
}
