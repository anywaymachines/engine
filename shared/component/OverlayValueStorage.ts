import { EventHandler } from "engine/shared/event/EventHandler";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { ReadonlyObservableValue, ReadonlyObservableValueBase } from "engine/shared/event/ObservableValue";

export type ValueOverlayKey = string | object | number;

class OrderedMap<T extends defined> {
	private readonly valuesOrder: number[] = [];
	private readonly valuesMapOrdered = new Map<number, T>();
	private minIndex = -1;

	forEach(func: (key: number, value: T | undefined) => void) {
		for (const key of this.valuesOrder) {
			func(key, this.valuesMapOrdered.get(key));
		}
	}

	set(key: ValueOverlayKey, value: T, index?: number) {
		key = index ?? key;
		if (!typeIs(key, "number")) {
			key = this.minIndex;
			this.minIndex--;
		}

		const existing = this.valuesMapOrdered.get(key);
		if (existing === undefined) {
			this.valuesOrder.push(key);
			this.valuesOrder.sort();
		}

		this.valuesMapOrdered.set(key, value);
	}
}

const isObservableValue = (v: unknown): v is ReadonlyObservableValue<unknown> =>
	typeIs(v, "table") && "get" in v && "changed" in v;

interface Effect<T> {
	readonly key: ValueOverlayKey;
	func?: <K extends T>(value: K) => T;
}

export interface OverlayValueStorage<T> extends ReadonlyObservableValue<T> {}
/** Storage for a single value that can be set from multiple places */
export class OverlayValueStorage<T> implements ComponentTypes.DestroyableComponent, ReadonlyObservableValueBase<T> {
	static bool(): OverlayValueStorage<boolean> {
		return new OverlayValueStorage<boolean>(false, true);
	}

	readonly changed: ReadonlyArgsSignal<[value: T, prev: T]>;

	private readonly effects = new Map<ValueOverlayKey, Effect<T>>();
	private readonly effectsOrdered = new OrderedMap<Effect<T>>();
	private readonly eventHandler = new EventHandler();

	private readonly _value;
	readonly value: ReadonlyObservableValue<T>;
	private defaultComputingValue: T;

	constructor(
		private readonly defaultValue: T,
		defaultComputingValue?: NoInfer<T>,
	) {
		this._value = new ObservableValue<T>(defaultValue);
		this.value = this._value;
		this.changed = this.value.changed;

		this.defaultComputingValue = defaultComputingValue ?? defaultValue;
	}

	subscribeFrom(values: { readonly [k in string]: ReadonlyObservableValue<T> }): void {
		for (const [k, v] of pairs(values)) {
			this.and(k, v);
		}
	}

	setDefaultComputingValue(value: T): void {
		this.defaultComputingValue = value;
		this.update();
	}
	get(): T {
		return this.value.get();
	}

	private calculate(): T {
		if (this.effects.size() === 0) {
			return this.defaultValue;
		}

		let value = this.defaultComputingValue;
		this.effectsOrdered.forEach((k, effect) => {
			if (!effect?.func) return;
			value = effect.func(value);
		});

		return value;
	}

	private update() {
		this._value.set(this.calculate());
	}
	private sub(
		key: ValueOverlayKey | undefined,
		value: T | ReadonlyObservableValue<T> | undefined,
		combineType: "or" | "and" | "overlay",
		index: number | undefined,
	) {
		if (value === undefined) {
			this.subEffect(key, undefined, index);
			return;
		}

		if (isObservableValue(value)) {
			this.eventHandler.register(value.subscribe(() => this.update()));
		}

		const get = () => (isObservableValue(value) ? value.get() : value);
		if (combineType === "or") {
			this.subEffect(key, (v) => v || get(), index);
		} else if (combineType === "and") {
			this.subEffect(key, (v) => v && get(), index);
		} else if (combineType === "overlay") {
			this.subEffect(key, get, index);
		} else {
			combineType satisfies never;
		}
	}
	private subEffect(
		key: ValueOverlayKey | undefined,
		func: ((value: T) => T) | undefined,
		index: number | undefined,
	) {
		key ??= "mainkey#_$1";

		const existing = this.effects.get(key);
		if (existing !== undefined) {
			existing.func = func;
		} else if (func !== undefined) {
			const val: Effect<T> = { func, key };
			this.effects.set(key, val);
			this.effectsOrdered.set(key, val, index);
		}

		this.update();
	}

	overlay(key: ValueOverlayKey | undefined, value: T | ReadonlyObservableValue<T> | undefined, index?: number): void {
		this.sub(key, value, "overlay", index);
	}
	or(key: ValueOverlayKey | undefined, value: T | ReadonlyObservableValue<T> | undefined, index?: number): void {
		this.sub(key, value, "or", index);
	}
	and(key: ValueOverlayKey | undefined, value: T | ReadonlyObservableValue<T> | undefined, index?: number): void {
		this.sub(key, value, "and", index);
	}
	effect(key: ValueOverlayKey | undefined, func: ((value: T) => T) | undefined, index?: number): void {
		this.subEffect(key, func, index);
	}

	destroy(): void {
		this.eventHandler.unsubscribeAll();
	}
}
