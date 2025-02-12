import { ArgsSignal } from "engine/shared/event/Signal";
import type { ComponentTypes } from "engine/shared/component/Component";
import type {
	ObservableValue,
	ObservableValueBase,
	ReadonlyObservableValueBase,
} from "engine/shared/event/ObservableValue";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [FakeReadonlyObservableValueMacros, FakeObservableValueMacros, FakeObservableValueSetMacros];

//

/** Fake observable value, gets (and sets) its value from another and passes through the subscriptions to it. Destroy to disconnect (probably automate via Component.event.addObservable()) */
export interface FakeObservableValue<T> extends ObservableValue<T>, ReadonlyFakeObservableValue<T> {
	/** @deprecated @hidden */
	readonly __nominal_FakeObservable: "FakeObservableValue";
}

/** Fake observable value, gets its value from another and passes through the subscriptions to it. Destroy to disconnect (probably automate via Component.event.addObservable()) */
export interface ReadonlyFakeObservableValue<T>
	extends ReadonlyObservableValue<T>,
		ComponentTypes.DestroyableComponent {
	/** @deprecated @hidden */
	readonly __nominal_ReadonlyFakeObservable: "ReadonlyFakeObservableValue";
}

class FakeSignal<TOrigArgs extends unknown[] = [], TArgs extends unknown[] = []> extends ArgsSignal<TArgs> {
	private readonly sub: SignalConnection;

	constructor(original: ReadonlyArgsSignal<TOrigArgs>, middleware: (...args: TOrigArgs) => TArgs) {
		super();
		this.sub = original.Connect((...args) => super.Fire(...middleware(...args)));
	}

	Fire(): void {
		throw "Firing a FakeSignal is not supported";
	}

	override destroy(): void {
		super.destroy();
		this.sub.Disconnect();
	}
}

//

declare module "engine/shared/event/ObservableValue" {
	interface ReadonlyObservableValue<T> {
		fReadonlyCreateBased<U>(func: (value: T) => U): ReadonlyFakeObservableValue<U>;
		fReadonlyWithDefault<U>(value: U): ReadonlyFakeObservableValue<(T & defined) | U>;
	}
}
export const FakeReadonlyObservableValueMacros: PropertyMacros<ReadonlyObservableValue<unknown>> = {
	fReadonlyCreateBased: <T, U>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T) => U,
	): ReadonlyFakeObservableValue<U> => {
		const changed = new FakeSignal(selv.changed, (value) => [func(value)]);

		return {
			changed,
			get() {
				return func(selv.get());
			},
			destroy() {
				changed.destroy();
			},
		} satisfies ReadonlyObservableValueBase<U> &
			ComponentTypes.DestroyableComponent as unknown as ReadonlyFakeObservableValue<U>;
	},
	fReadonlyWithDefault: <T, U>(
		selv: ReadonlyObservableValue<T>,
		value: U,
	): ReadonlyFakeObservableValue<(T & defined) | U> => {
		return selv.fReadonlyCreateBased((v) => v ?? value);
	},
};

declare module "engine/shared/event/ObservableValue" {
	interface ObservableValue<T> {
		fCreateBased<U>(funcTo: (value: T) => U, funcFrom: (value: U) => T): FakeObservableValue<U>;
		fWithDefault<U>(value: U): FakeObservableValue<(T & defined) | U>;
	}
}
export const FakeObservableValueMacros: PropertyMacros<ObservableValue<unknown>> = {
	fCreateBased: <T, U>(
		selv: ObservableValue<T>,
		funcTo: (value: T) => U,
		funcFrom: (value: U) => T,
	): FakeObservableValue<U> => {
		return {
			...selv.fReadonlyCreateBased<U>(funcTo),
			set(value, forceSet) {
				selv.set(funcFrom(value), forceSet);
			},
		} satisfies ObservableValueBase<U> & ComponentTypes.DestroyableComponent as unknown as FakeObservableValue<U>;
	},
	fWithDefault: <T, U>(selv: ObservableValue<T | U>, value: U): FakeObservableValue<(T & defined) | U> => {
		return selv.fCreateBased(
			(v) => v ?? value,
			(v) => v,
		);
	},
};

// declare module "engine/shared/event/ObservableCollection" {
// 	interface ObservableCollectionSet<T extends defined> {
// 		asArray(): FakeObservableValue<readonly T[]>;
// 	}
// }
// export const FakeObservableSetSetMacros: PropertyMacros<ObservableCollectionSet<defined>> = {
// 	asArray: <T extends defined>(selv: ObservableCollectionSet<T>): FakeObservableValue<readonly T[]> => {
// 		return selv.fCreateBased(
// 			(v) => [...v],
// 			(v) => new Set(v),
// 		);
// 	},
// };

declare module "engine/shared/event/ObservableValue" {
	interface ObservableValue<T> {
		asArray<Item>(this: ObservableValue<ReadonlySet<Item>>): FakeObservableValue<readonly Item[]>;
	}
}
export const FakeObservableValueSetMacros: PropertyMacros<ObservableValue<ReadonlySet<defined>>> = {
	asArray: <Item extends defined>(selv: ObservableValue<ReadonlySet<Item>>): FakeObservableValue<readonly Item[]> => {
		return selv.fCreateBased(
			(v) => [...v],
			(v) => new Set(v),
		);
	},
};
