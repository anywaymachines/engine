import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal, Signal } from "engine/shared/event/Signal";
import { Objects } from "engine/shared/fixes/Objects";
import { Strings } from "engine/shared/fixes/String.propmacro";
import type { FakeObservableValue } from "engine/shared/event/FakeObservableValue.propmacro";

export namespace Observables {
	type MultiValues<T, K extends string | number | symbol = string> = { readonly [k in K]: T };

	interface DestoyableOV<T> extends ObservableValue<T>, FakeObservableValue<T> {}
	class DestoyableOV<T> extends ObservableValue<T> {
		private readonly destroyed = new ArgsSignal();

		onDestroy(func: () => void): void {
			this.destroyed.Connect(func);
		}

		destroy(): void {
			this.destroyed.Fire();
			super.destroy();
		}
	}

	//

	export function createObservableSwitch<T extends string>(sources: {
		readonly [k in T]: ObservableValue<boolean>;
	}): FakeObservableValue<T> {
		const result = new DestoyableOV<T>(firstKey(sources)!);
		const subs: SignalConnection[] = [];

		subs.push(
			result.subscribe((value) => {
				for (const [k, v] of pairs(sources)) {
					v.set(k === value);
				}
			}),
		);

		for (const [k, v] of pairs(sources)) {
			subs.push(
				v.subscribe((value) => {
					if (!value) return;
					result.set(k);
				}, true),
			);
		}

		result.onDestroy(() => {
			for (const sub of subs) {
				sub.Disconnect();
			}
		});
		return result;
	}
	export function createObservableSwitchFromObject<TObj extends object, T extends string>(
		object: ObservableValue<TObj>,
		sources: { readonly [k in T]: PartialThrough<TObj> },
	): FakeObservableValue<T> {
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

	/** Create a single observable from multiple, bidirectional. */
	export function createObservableFromMultiple<O extends object>(observables: {
		readonly [k in keyof O]: ObservableValue<O[k]>;
	}): FakeObservableValue<O>;
	export function createObservableFromMultiple<T extends defined, K extends string | number | symbol>(
		observables: MultiValues<ObservableValue<T>, K>,
	): FakeObservableValue<MultiValues<T, K>>;
	export function createObservableFromMultiple<T extends defined, K extends string | number | symbol>(
		observables: MultiValues<ObservableValue<T>, K>,
	): FakeObservableValue<MultiValues<T, K>> {
		let inRetUpdate = false;

		const setObject = (mv: MultiValues<T, K>): void => {
			inRetUpdate = true;

			try {
				for (const [k, obs] of pairs(observables)) {
					obs.set(mv[k]);
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

		const ret = new DestoyableOV<MultiValues<T, K>>(getValueFromObject());
		const sub = Signal.multiConnection(
			ret.subscribe(setObject),
			...asMap(observables).map((k, v) => v.subscribe(setValue)),
		);
		ret.onDestroy(() => sub.Disconnect());

		return ret;
	}

	/** Strictly typed version of {@link createObservableFromObjectProperty} */
	export function createObservableFromObjectPropertyTyped<
		const TObj extends object,
		const TPath extends readonly string[],
	>(object: ObservableValue<TObj>, path: TPath): FakeObservableValue<Objects.ValueOf<TObj, TPath>>;
	export function createObservableFromObjectPropertyTyped<T>(
		object: ObservableValue<object>,
		path: readonly string[],
	): FakeObservableValue<T> {
		return createObservableFromObjectProperty(object, path);
	}

	/** Create an ObservableValue from the object property specified by a path. */
	export function createObservableFromObjectProperty<T>(
		object: ObservableValue<object>,
		path: readonly string[],
	): FakeObservableValue<T> {
		return object.fCreateBased(
			(obj) => {
				print("gobp", Strings.pretty(path));
				return Objects.getValueByPath(obj, path) as T;
			},
			(val) => Objects.deepCombine(object.get(), Objects.createObjectWithValueByPath(val, path)),
		);
	}
}
