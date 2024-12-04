import { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ObservableSwitch, ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

class SparseArray<T> {
	private readonly order: number[] = [];
	private readonly values: { [k in number]: { 0?: T } } = {};

	set(index: number, value: T | undefined): void {
		if (!this.values[index]) {
			this.order.push(index);
			this.order.sort();

			this.values[index] = {};
		}

		this.values[index][0] = value;
	}

	last(): T | undefined {
		for (let i = this.order.size() - 1; i >= 0; --i) {
			const index = this.order[i];

			if (this.values[index][0]) {
				return this.values[index][0];
			}
		}
	}
}

class InstanceValue<T> {
	private readonly overlays = new SparseArray<T>();
	private ands?: ObservableSwitch;
	readonly transforms: InstanceValueTransformContainer<T>;

	private readonly _value: ObservableValue<T>;
	readonly value: ReadonlyObservableValue<T>;

	constructor(
		private readonly defaultValue: T,
		set: (value: T) => void,
	) {
		this._value = new ObservableValue(defaultValue);
		this.value = this._value;

		this.transforms = new InstanceValueTransformContainer(defaultValue, set);
		this.value.subscribe((value) => this.transforms.value.set(value));
	}

	private get(): T {
		return (this.ands?.get() as T | undefined) ?? this.overlays.last() ?? this.defaultValue;
	}

	overlay(zindex: number, value: T | undefined): void {
		this.overlays.set(zindex, value);
		this._value.set(this.get());
	}

	and(this: InstanceValue<boolean>, key: ObservableSwitchKey | undefined, value: boolean): void {
		key ??= "main_InstanceValue";

		this.ands ??= new ObservableSwitchAnd(false);
		this.ands.set(key, value);

		this._value.set(this.get());
	}
}

//

/** Stores Instance properties, provides methods to change them, with native support for transforms */
export class InstanceValuesComponent<out T extends Instance> implements ComponentTypes.DestroyableComponent {
	private readonly values = new Map<string, InstanceValue<unknown>>();
	private readonly instance: T;

	constructor(component: InstanceComponent<T>) {
		this.instance = component.instance;
	}

	get<const K extends keyof T & string>(key: K): InstanceValue<T[K]> {
		const existing = this.values.get(key);
		if (existing) return existing as unknown as InstanceValue<T[K]>;

		const part = new InstanceValue(this.instance[key], (value) => (this.instance[key] = value));
		this.values.set(key, part as InstanceValue<unknown>);

		return part;
	}

	destroy(): void {
		this.values.clear();
	}
}
