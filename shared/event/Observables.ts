import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Objects } from "engine/shared/fixes/Objects";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";
import type { SignalReadonlySubmittableValue } from "engine/shared/event/SubmittableValue";

type Reg = () => SignalConnection;

export interface DisconnectableReadonlyObservableCreation<T> {
	readonly observable: ReadonlyObservableValue<T>;
	readonly reg: Reg;
}
export interface DisconnectableObservableCreation<T> {
	readonly observable: ObservableValue<T>;
	readonly reg: Reg;
}

export namespace Observables {
	function multiReg(regs: readonly Reg[]): Reg {
		return () => Signal.multiConnection(...regs.map((r) => r()));
	}

	export function createObservableSwitch<T extends string>(sources: {
		readonly [k in T]: ObservableValue<boolean>;
	}): DisconnectableObservableCreation<T> {
		const result = new ObservableValue<T>(firstKey(sources)!);
		const regs: Reg[] = [];

		regs.push(() =>
			result.subscribe((value) => {
				for (const [k, v] of pairs(sources)) {
					v.set(k === value);
				}
			}),
		);

		for (const [k, v] of pairs(sources)) {
			regs.push(() =>
				v.subscribe((value) => {
					if (!value) return;
					result.set(k);
				}, true),
			);
		}

		return { observable: result, reg: multiReg(regs) };
	}

	export function createObservableSwitchFromObject<TObj extends object, T extends string>(
		object: ObservableValue<TObj>,
		sources: { readonly [k in T]: PartialThrough<TObj> },
	): DisconnectableObservableCreation<T> {
		return createObservableSwitch(
			Objects.mapValues(sources, (k, v) =>
				object.createBothWayBased<boolean>(
					(c) => {
						if (!c) return object.get();
						return Objects.deepCombine(object.get(), v);
					},
					(c) => Objects.objectDeepEqualsExisting(c, v),
				),
			),
		);
	}

	export function createObservableFromObjectPropertySV<TObj extends object, T>(
		object: ObservableValue<TObj>,
		value: SignalReadonlySubmittableValue<T>,
		path: readonly string[],
	): DisconnectableObservableCreation<T> {
		const setObject = (): void =>
			object.set(Objects.deepCombine(object.get(), Objects.createObjectWithValueByPath(value.get(), path)));

		const getValueFromObject = () => Objects.getValueByPath(object.get(), path) as T;
		const setValue = () => value.set(getValueFromObject());

		const observable = new ObservableValue<T>(getValueFromObject());
		const reg: Reg = () => {
			const s1 = value.submitted.Connect(setObject);
			return Signal.multiConnection(s1, object.subscribe(setValue));
		};

		return { observable, reg: reg };
	}

	type MultiValues<T, K extends string | number | symbol = string> = {
		readonly [k in K]: T;
	};
	export function createObservableFromMultipleObjectsProperty<TObj extends object, T extends defined>(
		objects: MultiValues<ObservableValue<TObj>>,
		value: ObservableValue<MultiValues<T>>,
		path: readonly string[],
	): DisconnectableObservableCreation<MultiValues<T>> {
		const setObject = (): void => {
			for (const [, obj] of pairs(objects)) {
				obj.set(Objects.deepCombine(obj.get(), Objects.createObjectWithValueByPath(value.get(), path)));
			}
		};

		const getValueFromObject = () =>
			Objects.mapValues(objects, (k, v) => Objects.getValueByPath(v.get(), path) as T);
		const setValue = () => value.set(getValueFromObject());

		const observable = new ObservableValue<MultiValues<T>>(getValueFromObject());
		const reg: Reg = () =>
			Signal.multiConnection(value.subscribe(setObject), ...asMap(objects).map((k, v) => v.subscribe(setValue)));

		return { observable, reg };
	}
	export function createObservableFromMultipleObjectsPropertySV<TObj extends object, T extends defined>(
		objects: MultiValues<ObservableValue<TObj>>,
		value: SignalReadonlySubmittableValue<MultiValues<T>>,
		path: readonly string[],
	): DisconnectableObservableCreation<MultiValues<T>> {
		const setObject = (): void => {
			for (const [, obj] of pairs(objects)) {
				obj.set(Objects.deepCombine(obj.get(), Objects.createObjectWithValueByPath(value.get(), path)));
			}
		};

		const getValueFromObject = () =>
			Objects.mapValues(objects, (k, v) => Objects.getValueByPath(v.get(), path) as T);
		const setValue = () => value.set(getValueFromObject());

		const observable = new ObservableValue<MultiValues<T>>(getValueFromObject());
		const reg: Reg = () => {
			return Signal.multiConnection(
				value.submitted.Connect(setObject),
				...asMap(objects).map((k, v) => v.subscribe(setValue)),
			);
		};

		return { observable, reg };
	}

	//

	/** Create an ObservableValue from the object property specified by a path. */
	export function createObservableFromObjectProperty<T>(
		object: ObservableValue<object>,
		path: readonly string[],
	): DisconnectableObservableCreation<T> {
		const setObject = (): void =>
			object.set(Objects.deepCombine(object.get(), Objects.createObjectWithValueByPath(ret.get(), path)));

		const getValueFromObject = () => Objects.getValueByPath(object.get(), path) as T;
		const setValue = () => ret.set(getValueFromObject());

		const ret = new ObservableValue<T>(getValueFromObject());
		const reg: Reg = () => Signal.multiConnection(ret.subscribe(setObject), object.subscribe(setValue));

		return { observable: ret, reg: reg };
	}

	/** Create a single observable from multiple, bidirectional. */
	export function createObservableFromMultiple<T extends defined, K extends string | number | symbol>(
		observables: MultiValues<ObservableValue<T>, K>,
	): DisconnectableObservableCreation<MultiValues<T, K>> {
		let inRetUpdate = false;

		const setObject = (): void => {
			inRetUpdate = true;

			try {
				for (const [k, obs] of pairs(observables)) {
					obs.set(ret.get()[k]);
				}
			} finally {
				inRetUpdate = false;
			}
		};

		const getValueFromObject = () => Objects.mapValues(observables, (k, v) => v.get());
		const setValue = () => {
			if (inRetUpdate) return;
			ret.set(getValueFromObject());
		};

		const ret = new ObservableValue<MultiValues<T, K>>(getValueFromObject());
		const reg: Reg = () => {
			return Signal.multiConnection(
				ret.subscribe(setObject),
				...asMap(observables).map((k, v) => v.subscribe(setValue)),
			);
		};

		return { observable: ret, reg };
	}
}
