import { ObservableValue } from "engine/shared/event/ObservableValue";

const defaultIndex = 9999999999;
const instances = new Map<Instance, InstanceOverlayStorage<Instance>>();

export class InstanceOverlayStorage<T extends object> {
	static of<T extends Instance, const TKeys extends keyof T>(
		instance: T,
		keys: TKeys[],
	): InstanceOverlayStorage<{ [k in TKeys]: T[k] }>;
	static of<T extends Instance>(instance: T): InstanceOverlayStorage<T>;
	static of<T extends Instance>(instance: T, keys?: (keyof T)[]): InstanceOverlayStorage<T> {
		const overlay = instances.get(instance);
		if (overlay) {
			return overlay as unknown as InstanceOverlayStorage<T>;
		}

		const ret = new InstanceOverlayStorage<T>(instance);
		instances.set(instance, ret);
		instance.Destroying.Connect(() => instances.delete(instance));

		if (keys) {
			for (const k of keys) {
				ret.trySetDefaultValueFromInstance(k);
			}
		}

		return ret;
	}

	private readonly _value: ObservableValue<T>;
	readonly value: ReadonlyObservableValue<T>;

	private readonly order: number[] = [];
	private readonly overlays: Record<number, readonly [meta: Partial<T>, backend: Partial<T>]> = {};

	constructor(
		private readonly instance: T,
		changed?: (value: T, prev: T) => void,
	) {
		this.order.push(defaultIndex);
		this.overlays[defaultIndex] = [instance, instance];

		this._value = new ObservableValue<T>(instance);
		this.value = this._value.asReadonly();

		if (changed) {
			this.value.subscribe(changed);
		}
	}

	trySetDefaultValue<k extends keyof T>(key: k, value: T[k]): void {
		this.overlays[defaultIndex][1][key] = value;
	}
	trySetDefaultValueFromInstance(key: keyof T): void {
		this.trySetDefaultValue(key, this.instance[key]);
	}

	private calculate(): T {
		const ret: Partial<T> = {};
		for (const k of this.order) {
			for (const [key, value] of pairs(this.overlays[k][1])) {
				if (key in ret) continue;
				ret[key] = value;
			}
		}

		return ret as T;
	}

	/** Register an overlay
	 * @param zindex The order of the overlay, lower is earlier.
	 */
	get(zindex: number): Partial<T> {
		if (this.overlays[zindex] !== undefined) {
			return this.overlays[zindex][0];
		}

		this.order.push(zindex);
		table.sort(this.order);

		const backend: Partial<T> = {};
		const metatable: LuaMetatable<Partial<T>> = {
			__index: (_, key) => rawget(backend, key),
			__newindex: (_, key, value) => {
				rawset(backend, key, value);
				this._value.set(this.calculate());
			},
		};

		const overlay: Partial<T> = {};
		setmetatable(overlay, metatable);
		this.overlays[zindex] = [overlay, backend];

		return overlay;
	}
}
