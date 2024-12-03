import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";

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
	private readonly ands = new Map<string | object, T>();
	readonly transforms: InstanceValueTransformContainer<T>;

	constructor(
		private readonly defaultValue: T,
		set: (value: T) => void,
	) {
		this.transforms = new InstanceValueTransformContainer(defaultValue, set);
	}

	private get(): T {
		for (const val of this.ands) {
			if (!val) {
				return val;
			}
		}

		return this.overlays.last() ?? this.defaultValue;
	}

	overlay(zindex: number, value: T | undefined): void {
		this.overlays.set(zindex, value);
		this.transforms.value.set(this.get());
	}

	and(this: InstanceValue<boolean>, key: string | object | undefined, value: boolean): void {
		key ??= "main_InstanceValue";
		this.ands.set(key, value);

		this.transforms.value.set(this.get());
	}
}

class _InstanceValueStorage<T extends Instance> extends InstanceComponent<T> implements InstanceValueStorage<T> {
	private readonly values = new Map<keyof T, InstanceValue<T[keyof T]>>();

	constructor(instance: T) {
		super(instance, { destroyInstanceOnComponentDestroy: false });
	}

	get<const K extends keyof T>(key: K): InstanceValue<T[K]> {
		const existing = this.values.get(key);
		if (existing) return existing as unknown as InstanceValue<T[K]>;

		const part = new InstanceValue(this.instance[key], (value) => (this.instance[key] = value));
		this.values.set(key, part as unknown as InstanceValue<T[keyof T]>);

		return part;
	}

	addDefaultValuesFromObject(keys: (keyof T)[]): void {
		for (const key of keys) {
			if (this.values.has(key)) continue;
			this.values.set(key, new InstanceValue(this.instance[key], (value) => (this.instance[key] = value)));
		}
	}
}

export interface InstanceValueStorage<T extends object> {
	get<const k extends keyof T>(key: k): InstanceValue<T[k]>;
	addDefaultValuesFromObject(keys: (keyof T)[]): void;
}
export namespace InstanceValueStorage {
	const components = new Map<Instance, InstanceValueStorage<Instance>>();

	export function of<T extends Instance, const TKeys extends keyof T>(
		instance: T,
		keys: TKeys[],
	): InstanceValueStorage<{ [k in TKeys]: T[k] }>;
	export function of<T extends Instance>(instance: T): InstanceValueStorage<T>;
	export function of<T extends Instance>(instance: T): InstanceValueStorage<T> {
		const existing = components.get(instance);
		if (existing) return existing as unknown as InstanceValueStorage<T>;

		const component = new _InstanceValueStorage<T>(instance);
		component.enable();
		components.set(instance, component as InstanceValueStorage<Instance>);

		return component;
	}

	export function get<T extends Instance, K extends keyof T>(instance: T, key: K): InstanceValue<T[K]> {
		return of(instance).get(key);
	}
}
