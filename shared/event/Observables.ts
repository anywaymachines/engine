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

	export function createObservableFromObjectProperty<TObj extends object, T>(
		object: ObservableValue<TObj>,
		value: ObservableValue<T>,
		path: readonly string[],
	): DisconnectableObservableCreation<T> {
		const setObject = (): void =>
			object.set(Objects.deepCombine(object.get(), Objects.createObjectWithValueByPath(value.get(), path)));

		const getValueFromObject = () => Objects.getValueByPath(object.get(), path) as T;
		const setValue = () => value.set(getValueFromObject());

		const observable = new ObservableValue<T>(getValueFromObject());
		const reg: Reg = () => Signal.multiConnection(value.subscribe(setObject), object.subscribe(setValue));

		return { observable, reg: reg };
	}
	export function createObservableFromObjectPropertySV<TObj extends object, T>(
		object: ObservableValue<TObj>,
		value: SignalReadonlySubmittableValue<T>,
		path: readonly string[],
		subtype: "submit" | "value" = "submit",
	): DisconnectableObservableCreation<T> {
		const setObject = (): void =>
			object.set(Objects.deepCombine(object.get(), Objects.createObjectWithValueByPath(value.get(), path)));

		const getValueFromObject = () => Objects.getValueByPath(object.get(), path) as T;
		const setValue = () => value.set(getValueFromObject());

		const observable = new ObservableValue<T>(getValueFromObject());
		const reg: Reg = () => {
			const s1 =
				subtype === "submit"
					? value.submitted.Connect(setObject)
					: subtype === "value"
						? value.value.subscribe(setObject)
						: (subtype satisfies never);

			return Signal.multiConnection(s1, object.subscribe(setValue));
		};

		return { observable, reg: reg };
	}
}
