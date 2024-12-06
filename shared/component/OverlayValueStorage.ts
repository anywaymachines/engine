import { EventHandler } from "engine/shared/event/EventHandler";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

class OrderedMap<T extends defined> {
	private readonly valuesOrder: number[] = [];
	private readonly valuesMapOrdered = new Map<number, T>();
	private minIndex = -1;

	size(): number {
		return this.valuesOrder.size();
	}

	forEach(func: (key: number, value: T | undefined) => void) {
		for (const key of this.valuesOrder) {
			func(key, this.valuesMapOrdered.get(key));
		}
	}

	set(key: ObservableSwitchKey, value: T) {
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

interface Value<T> {
	value: T | ReadonlyObservableValue<T> | undefined;
	readonly key: ObservableSwitchKey;
	readonly combineType: "or" | "and" | "overlay";
}

export interface OverlayValueStorage<T> extends ReadonlyObservableValue<T> {}
/** Storage for a single value that can be set from multiple places */
export class OverlayValueStorage<T> implements ComponentTypes.DestroyableComponent, ReadonlyObservableValueBase<T> {
	readonly changed: ReadonlyArgsSignal<[value: T, prev: T]>;

	private readonly valuesOrdered = new OrderedMap<Value<T>>();
	private readonly values = new Map<ObservableSwitchKey, Value<T>>();
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

	setDefaultComputingValue(value: T): void {
		this.defaultComputingValue = value;
		this.update();
	}
	get(): T {
		return this.value.get();
	}

	private calculate(): T {
		if (this.valuesOrdered.size() === 0) {
			return this.defaultValue;
		}

		let value = this.defaultComputingValue;
		this.valuesOrdered.forEach((k, v) => {
			if (v?.value === undefined) return;

			const actualValue = isObservableValue(v.value) //
				? v.value.get()
				: v.value;

			if (v.combineType === "or") {
				value ||= actualValue;
			} else if (v.combineType === "and") {
				value &&= actualValue;
			} else if (v.combineType === "overlay") {
				value = actualValue;
			} else {
				v.combineType satisfies never;
			}
		});

		return value;
	}

	private update() {
		this._value.set(this.calculate());
	}
	private sub(key: Value<T>["key"] | undefined, value: Value<T>["value"], combineType: Value<T>["combineType"]) {
		if (isObservableValue(value)) {
			this.eventHandler.register(value.subscribe(() => this.update()));
		}
		key ??= "mainkey#_$1";

		const existing = this.values.get(key);

		if (existing !== undefined) {
			existing.value = value;
		} else if (value !== undefined) {
			const val: Value<T> = { value, key, combineType };
			this.values.set(key, val);
			this.valuesOrdered.set(key, val);
		}

		this.update();
	}

	overlay(key: ObservableSwitchKey | undefined, value: T | ReadonlyObservableValue<T> | undefined): void {
		this.sub(key, value, "overlay");
	}
	or(key: ObservableSwitchKey | undefined, value: T | ReadonlyObservableValue<T> | undefined): void {
		this.sub(key, value, "or");
	}
	and(key: ObservableSwitchKey | undefined, value: T | ReadonlyObservableValue<T> | undefined): void {
		this.sub(key, value, "and");
	}

	destroy(): void {
		this.eventHandler.unsubscribeAll();
	}
}
