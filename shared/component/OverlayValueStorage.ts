import { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { EventHandler } from "engine/shared/event/EventHandler";
import { isReadonlyObservableValue, ObservableValue } from "engine/shared/event/ObservableValue";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { ComponentEvents } from "engine/shared/component/ComponentEvents";
import type { TransformBuilder, TransformProps } from "engine/shared/component/Transform";
import type { ReadonlyObservableValue, ReadonlyObservableValueBase } from "engine/shared/event/ObservableValue";

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

interface Effect<T> {
	readonly key: ValueOverlayKey;
	func?: <K extends T>(value: K) => T;
}

export type ValueOverlayKey = string | object | number;
export type OverlaySubValue<T> = T | ReadonlyObservableValue<T> | ReadonlyObservableValue<ReadonlyObservableValue<T>>;

export interface OverlayValueStorage<T> extends ReadonlyObservableValue<T> {}
/** Storage for a single value that can be set from multiple places */
export class OverlayValueStorage<T> implements ComponentTypes.DestroyableComponent, ReadonlyObservableValueBase<T> {
	static bool(): OverlayValueStorage<boolean> {
		return new OverlayValueStorage<boolean>(false, true);
	}

	readonly changed: ReadonlyArgsSignal<[value: T, prev: T]>;

	private readonly effects = new Map<ValueOverlayKey, Effect<T>>();
	private readonly effectsOrdered = new OrderedMap<Effect<T>>();
	private readonly eventHandlers = new Map<
		ValueOverlayKey,
		{
			k1?: SignalConnection;
			k2?: SignalConnection;
			transforms1?: InstanceValueTransformContainer<T>;
			transforms2?: InstanceValueTransformContainer<T>;
		}
	>();
	private readonly transforms;

	readonly value: ReadonlyObservableValue<T>;
	private defaultComputingValue: T;

	constructor(
		private readonly defaultValue: T,
		defaultComputingValue?: NoInfer<T>,
	) {
		const value = new ObservableValue<T>(defaultValue);
		this.value = value;
		this.changed = this.value.changed;
		this.transforms = new InstanceValueTransformContainer(value);

		this.defaultComputingValue = defaultComputingValue ?? defaultValue;
	}

	subscribeAndFrom(values: { readonly [k in string]: ReadonlyObservableValue<T> }): void {
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
		this.transforms.set(this.calculate());
	}
	private sub(
		key: ValueOverlayKey | undefined,
		value: OverlaySubValue<T> | undefined,
		combineType: "or" | "and" | "overlay",
		index: number | undefined,
	) {
		if (value === undefined) {
			this.subEffect(key, undefined, index);
			return;
		}
		const isOverlayValueStorage = (value: unknown): value is OverlayValueStorage<T> => {
			return typeIs(value, "table") && value instanceof OverlayValueStorage;
		};

		const subChangesToObservable = () => {
			const sub1 = (value: OverlaySubValue<T> | undefined) => {
				eh.k1?.Disconnect();
				eh.k1 = undefined;
				eh.transforms1 = undefined;

				if (!isReadonlyObservableValue(value)) return;
				if (isOverlayValueStorage(value)) {
					eh.transforms1 = value.transforms;
				}

				eh.k1 = value.subscribe((v) => {
					sub2(v);
					this.update();
				});
				sub2(value.get());
			};

			const sub2 = (value: OverlaySubValue<T> | undefined) => {
				eh.k2?.Disconnect();
				eh.k2 = undefined;
				eh.transforms2 = undefined;

				if (!isReadonlyObservableValue(value)) return;
				if (isOverlayValueStorage(value)) {
					eh.transforms2 = value.transforms;
				}

				eh.k2 = value.subscribe(() => {
					this.update();
				});
			};

			const eh = this.eventHandlers.getOrSet(key ?? "mainkey#_$1", () => ({}));
			sub1(value);
		};
		subChangesToObservable();

		const get = (): T => {
			if (!isReadonlyObservableValue(value)) return value;
			if (isOverlayValueStorage(value)) value.update();

			const v = value.get();
			if (!isReadonlyObservableValue(v)) return v;
			if (isOverlayValueStorage(v)) v.update();

			return v.get();
		};

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

	addChildOverlay(value: OverlaySubValue<T>): OverlayValueStorage<T> {
		const ovv = new OverlayValueStorage(this.defaultValue, this.defaultComputingValue);
		ovv.overlay(undefined, value);
		this.overlay({}, ovv);

		return ovv;
	}
	addTransform(func: (value: T, observable: ObservableValue<T>) => TransformBuilder): this {
		this.transforms.addTransform(func);
		return this;
	}
	addBasicTransform(props: TransformProps = Transforms.quadOut02): this {
		return this.addTransform((value, observable) =>
			Transforms.create().transformObservable(observable, value, props),
		);
	}

	finishTransforms(): void {
		TransformService.finish(this.transforms);

		for (const [, values] of this.eventHandlers) {
			const t1 = values?.transforms1;
			if (t1) TransformService.finish(t1);

			const t2 = values?.transforms2;
			if (t2) TransformService.finish(t2);
		}
	}
	waitForTransforms(): TransformBuilder {
		let tr = Transforms.create() //
			.waitForTransformOf(this.transforms);

		for (const [, values] of this.eventHandlers) {
			const t1 = values?.transforms1;
			if (t1) tr = tr.waitForTransformOf(t1);

			const t2 = values?.transforms2;
			if (t2) tr = tr.waitForTransformOf(t2);
		}

		return tr;
	}

	/*
	export function transitionBetweenObservables<K extends defined, T>(
		event: ComponentEvents,
		value: ReadonlyObservableValue<K>,
		observables: ReadonlyMap<K, ReadonlyObservableValue<T>>,
		props: TransformProps,
	): ObservableValue<T> {
		const ret = new ObservableValue<T>(observables.get(value.get())!.get());

		const eh = new EventHandler();
		event.state.onDisable(() => eh.unsubscribeAll());
		event.subscribeObservable(value, (value) => {
			eh.unsubscribeAll();

			const ov = observables.get(value)!;
			Transforms.create()
				.transformObservable(ret, ov, props)
				.then()
				.func(() => eh.register(ov.subscribe((v) => ret.set(v))))
				.run(ret, true);
		});

		return ret;
	}
	*/
	addTransitionBetweenBoolObservables(
		event: ComponentEvents,
		value: ReadonlyObservableValue<boolean>,
		otrue: ReadonlyObservableValue<T>,
		ofalse: ReadonlyObservableValue<T>,
		props: TransformProps,
	): void {
		const create = () => {
			const ret = new ObservableValue<T>(value.get() ? otrue.get() : ofalse.get());

			const eh = new EventHandler();
			event.state.onDisable(() => eh.unsubscribeAll());

			const update = (props: TransformProps | undefined) => {
				eh.unsubscribeAll();

				const ov = value.get() ? otrue : ofalse;
				Transforms.create()
					.transformObservable(ret, ov, props)
					.then()
					.func(() => eh.register(ov.subscribe((v) => ret.set(v))))
					.run(ret, true);
			};
			event.subscribeObservable(value, () => update(props));
			event.state.onEnable(() => update(undefined));

			return ret;
		};

		this.overlay({}, create());
	}

	overlay(key: ValueOverlayKey | undefined, value: OverlaySubValue<T> | undefined, index?: number): void {
		this.sub(key, value, "overlay", index);
	}
	or(key: ValueOverlayKey | undefined, value: OverlaySubValue<T> | undefined, index?: number): void {
		this.sub(key, value, "or", index);
	}
	and(key: ValueOverlayKey | undefined, value: OverlaySubValue<T> | undefined, index?: number): void {
		this.sub(key, value, "and", index);
	}
	effect(key: ValueOverlayKey | undefined, func: ((value: T) => T) | undefined, index?: number): void {
		this.subEffect(key, func, index);
	}

	destroy(): void {
		this.transforms.destroy();

		for (const [, eh] of this.eventHandlers) {
			for (const [k, v] of pairs(eh)) {
				if ("Disconnect" in v) {
					v.Disconnect();
				}
			}
		}
		this.eventHandlers.clear();
	}
}
