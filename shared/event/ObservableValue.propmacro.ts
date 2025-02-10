import { EventHandler } from "engine/shared/event/EventHandler";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import type { DisconnectableObservableCreation } from "engine/shared/event/Observables";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ReadonlyObservableValueMacros, ObservableValueMacros, ObservableValueBoolMacros];

declare module "engine/shared/event/ObservableValue" {
	interface ReadonlyObservableValue<T> {
		subscribe(func: (value: T, prev: T) => void, executeImmediately?: boolean): SignalConnection;

		/** @deprecated Use {@link createBasedDC} instead */
		createBased<TNew>(func: (value: T) => TNew): ReadonlyObservableValue<TNew>;
		createBasedDC<U>(func: (value: T) => U): DisconnectableObservableCreation<U>;

		withDefault<U>(value: U): DisconnectableObservableCreation<(T & defined) | U>;

		/** Creates a new ObservableValue that always has the opposite value. */
		not(this: ReadonlyObservableValue<boolean>): ReadonlyObservableValue<boolean>;
	}
}
export const ReadonlyObservableValueMacros: PropertyMacros<ReadonlyObservableValue<unknown>> = {
	subscribe: <T>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T, prev: T) => void,
		executeImmediately: boolean = false,
	): SignalConnection => {
		const sub = selv.changed.Connect(func);

		if (executeImmediately) {
			func(selv.get(), selv.get());
		}

		return sub;
	},

	createBased: <T, TNew>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T) => TNew,
	): ReadonlyObservableValue<TNew> => {
		const { observable, reg } = selv.createBasedDC(func);
		reg();

		return observable;
	},
	createBasedDC: <T, U>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T) => U,
	): DisconnectableObservableCreation<U> => {
		const observable = new ObservableValue<U>(func(selv.get()));
		const reg = () => selv.subscribe((value) => observable.set(func(value)), true);

		return { observable, reg };
	},

	withDefault: <T, U>(
		selv: ReadonlyObservableValue<T>,
		defaultValue: U,
	): DisconnectableObservableCreation<(T & defined) | U> => {
		return selv.createBasedDC((value) => value ?? defaultValue);
	},

	not: (selv) => selv.createBased((v) => !v),
};

declare module "engine/shared/event/ObservableValue" {
	interface ReadonlyObservableValue<T> {
		/** Has true value if any of the obsevables in the provided collection have a true value */
		createBasedAnyDC<Item extends T extends readonly (infer I)[] ? I : never>(
			this: ReadonlyObservableValue<readonly Item[]>,
			func: (value: Item) => ReadonlyObservableValue<boolean>,
		): DisconnectableObservableCreation<boolean>;
	}
}
export const ReadonlyObservableValueArrayMacros: PropertyMacros<ReadonlyObservableValue<readonly defined[]>> = {
	createBasedAnyDC: <Item extends defined>(
		selv: ReadonlyObservableValue<readonly Item[]>,
		func: (value: Item) => ReadonlyObservableValue<boolean>,
	): DisconnectableObservableCreation<boolean> => {
		const eh = new EventHandler();

		const resub = (): void => {
			eh.unsubscribeAll();

			for (const item of selv.get()) {
				const ov = func(item);
				eh.register(ov.subscribe(() => observable.set(calculate())));
			}

			observable.set(calculate());
		};

		const calculate = (): boolean => selv.get().any((v) => func(v).get());
		const observable = new ObservableValue<boolean>(calculate());

		const reg = (): SignalConnection => {
			resub();
			return Signal.connection(() => eh.unsubscribeAll());
		};

		return { observable, reg };
	},
};

declare module "engine/shared/event/ObservableValue" {
	interface ObservableValue<T> {
		asReadonly(): ReadonlyObservableValue<T>;
		createBothWayBased<TNew>(toOld: (value: TNew) => T, toNew: (value: T) => TNew): ObservableValue<TNew>;

		withMiddleware(middleware: (value: T) => T): ObservableValue<T>;

		toggle(this: ObservableValue<boolean>): boolean;

		/** Connect two observables to have the same value. Immediately sets the other observable value to this one */
		connect(other: ObservableValue<T>): SignalConnection;
	}
}
export const ObservableValueMacros: PropertyMacros<ObservableValue<unknown>> = {
	asReadonly: <T>(selv: ObservableValue<T>): ReadonlyObservableValue<T> => {
		return selv;
	},

	createBothWayBased: <T, TNew>(
		selv: ObservableValue<T>,
		toOld: (value: TNew) => T,
		toNew: (value: T) => TNew,
	): ObservableValue<TNew> => {
		const observable = new ObservableValue<TNew>(toNew(selv.get()));
		observable.subscribe((value) => {
			selv.set(toOld(value));
			observable.set(toNew(selv.get()));
		});
		selv.subscribe((value) => observable.set(toNew(value)));

		return observable;
	},

	withMiddleware: <T>(selv: ObservableValue<T>, middleware: (value: T) => T): ObservableValue<T> => {
		const observable = new ObservableValue<T>(middleware(selv.get()), middleware);
		observable.subscribe((value) => selv.set(value));
		selv.subscribe((value) => observable.set(value));

		return observable;
	},

	connect: <T>(selv: ObservableValue<T>, other: ObservableValue<T>): SignalConnection => {
		return Signal.multiConnection(
			other.subscribe((value) => selv.set(value)),
			selv.subscribe((value) => other.set(value), true),
		);
	},
};

export const ObservableValueBoolMacros: PropertyMacros<ObservableValue<boolean>> = {
	toggle: (selv: ObservableValue<boolean>): boolean => {
		const val = !selv.get();
		selv.set(val);

		return val;
	},
};
