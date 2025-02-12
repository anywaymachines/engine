import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { TransformProps } from "engine/shared/component/Transform";

const defaultIndex = 9999999999;

/** @deprecated Use OverlayValueStorage instead */
export class ObjectOverlayStorage<T extends object> {
	private readonly _value;
	readonly value;

	private readonly order: number[] = [];
	private readonly overlays: Record<number, readonly [meta: Partial<T>, backend: Partial<T>]> = {};

	static transform<T extends object, TD extends Partial<T>>(
		object: T,
		defaultValues: TD,
		props: TransformProps,
	): ObjectOverlayStorage<TD> {
		return new ObjectOverlayStorage<TD>(defaultValues, (value) => {
			Transforms.create() //
				.transformMulti(object, value as never, props)
				.run(object);
		});
	}

	constructor(
		defaultValues: T,
		changed?: (value: T) => void,
		private readonly treatDefaultAsUndefined = false,
	) {
		this.order.push(defaultIndex);
		this.overlays[defaultIndex] = [defaultValues, defaultValues];

		this._value = new ObservableValue(defaultValues);
		this.value = this._value.asReadonly();

		if (changed) {
			this.value.subscribe(changed);
		}
	}

	getValues(): T {
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
				if (this.treatDefaultAsUndefined && value === this.get(defaultIndex)[key as keyof T]) {
					value = undefined;
				}

				rawset(backend, key, value);
				this._value.set(this.getValues());
			},
		};

		const overlay: Partial<T> = {};
		setmetatable(overlay, metatable);
		this.overlays[zindex] = [overlay, backend];

		return overlay;
	}
}
