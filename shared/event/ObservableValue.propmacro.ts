import { ObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ReadonlyObservableValueMacros, ObservableValueMacros];

declare global {
	interface ReadonlyObservableValue<T> {
		subscribe(func: (value: T, prev: T) => void, executeImmediately?: boolean): SignalConnection;

		createBased<TNew>(func: (value: T) => TNew): ReadonlyObservableValue<TNew>;

		/** Creates a new ObservableValue that always has the opposite value. */
		not(this: ReadonlyObservableValue<boolean>): ReadonlyObservableValue<boolean>;
	}
}
export const ReadonlyObservableValueMacros: PropertyMacros<ReadonlyObservableValue<unknown>> = {
	createBased: <T, TNew>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T) => TNew,
	): ReadonlyObservableValue<TNew> => {
		const observable = new ObservableValue<TNew>(func(selv.get()));
		selv.subscribe((value) => observable.set(func(value)));

		return observable;
	},

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

	not: (selv) => selv.createBased((v) => !v),
};

declare global {
	interface ObservableValue<T> {
		asReadonly(): ReadonlyObservableValue<T>;
		createBothWayBased<TNew>(toOld: (value: TNew) => T, toNew: (value: T) => TNew): ObservableValue<TNew>;
		withMiddleware(middleware: (value: T) => T): ObservableValue<T>;
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
};
