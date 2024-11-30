import { ObservableValue } from "engine/shared/event/ObservableValue";
import { JSON } from "engine/shared/fixes/Json";
import type { _ComponentEvents2 } from "engine/shared/component/ComponentEvents";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentEvents2Macros];

//

declare global {
	interface ComponentEventsPropMacros extends _ComponentEvents2 {
		onEnable(func: () => void, executeImmediately?: boolean): void;

		/** Register an event */
		subscribe<TArgs extends unknown[]>(signal: ReadonlyArgsSignal<TArgs>, callback: (...args: TArgs) => void): void;

		/** Register an event */
		subscribeRegistration(func: () => SignalConnection | readonly SignalConnection[] | undefined): void;

		/** Register an event and call the callback function on enable or immediately */
		subscribeImmediately<TArgs extends unknown[]>(
			signal: ReadonlyArgsSignal<TArgs>,
			callback: () => void,
			executeOnEnable?: boolean,
			executeImmediately?: boolean,
		): void;

		/** Subscribe to an observable value changed event */
		subscribeObservable<T>(
			observable: ReadonlyObservableValue<T>,
			callback: (value: T, prev: T) => void,
			executeOnEnable?: boolean,
			executeImmediately?: boolean,
		): void;

		/** Subscribe to an observable collection changed event */
		subscribeCollection<T extends defined>(
			observable: ReadonlyObservableCollection<T>,
			callback: (update: CollectionChangedArgs<T>) => void,
			executeOnEnable?: boolean,
			executeImmediately?: boolean,
		): void;

		/** Subscribe to an observable collection item added event */
		subscribeCollectionAdded<T extends defined>(
			observable: ReadonlyObservableCollection<T>,
			callback: (item: T) => void,
			executeOnEnable?: boolean,
			executeImmediately?: boolean,
		): void;

		/** Subscribe to an observable map changed event */
		subscribeMap<K extends defined, V extends defined>(
			observable: ReadonlyObservableMap<K, V>,
			callback: (key: K, value: V | undefined) => void,
			executeOnEnable?: boolean,
			executeImmediately?: boolean,
		): void;

		/** Create an `ReadonlyObservableValue` from an `Instance` property */
		readonlyObservableFromInstanceParam<
			TInstance extends Instance,
			TParam extends InstancePropertyNames<TInstance>,
		>(
			instance: TInstance,
			param: TParam,
		): ReadonlyObservableValue<TInstance[TParam]>;

		/** Create an `ObservableValue` from an `Instance` property */
		observableFromInstanceParam<TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
			instance: TInstance,
			param: TParam,
		): ObservableValue<TInstance[TParam]>;

		/** Create an `ObservableValue` from an `Instance` attribute */
		observableFromAttribute<TType extends AttributeValue>(
			instance: Instance,
			name: string,
		): ObservableValue<TType | undefined>;

		/** Create an `ObservableValue` from an `Instance` attribute, using JSON.ts */
		observableFromAttributeJson<TType>(instance: Instance, name: string): ObservableValue<TType | undefined>;

		/** Create an infinite loop that would only loop when this event holder is enabled */
		loop(interval: number, func: (dt: number) => void): SignalConnection;
	}
}
export const ComponentEvents2Macros: PropertyMacros<ComponentEventsPropMacros> = {
	onEnable: (selv, func, executeImmediately = false): void => {
		selv.state.onEnable(func);
		if (executeImmediately) func();
	},

	subscribe: <TArgs extends unknown[]>(
		selv: ComponentEventsPropMacros,
		signal: ReadonlyArgsSignal<TArgs>,
		callback: (...args: TArgs) => void,
	): void => {
		if (selv.state.isDestroyed()) return;

		const sub = () => selv.eventHandler.subscribe(signal, callback);

		selv.onEnable(sub);
		if (selv.state.isEnabled()) sub();
	},

	subscribeRegistration: (
		selv: ComponentEventsPropMacros,
		func: () => SignalConnection | readonly SignalConnection[] | undefined,
	): void => {
		if (selv.state.isDestroyed()) return;

		selv.onEnable(() => {
			const sub = func();
			if (!sub) return;

			if ("Disconnect" in sub) {
				selv.eventHandler.register(sub);
			} else {
				for (const connection of sub) {
					selv.eventHandler.register(connection);
				}
			}
		});
	},

	subscribeImmediately: <TArgs extends unknown[]>(
		selv: ComponentEventsPropMacros,
		signal: ReadonlyArgsSignal<TArgs>,
		callback: () => void,
		executeOnEnable = true,
		executeImmediately = false,
	): void => {
		if (selv.state.isDestroyed()) return;
		selv.subscribe(signal, callback);

		if (executeOnEnable) {
			selv.onEnable(callback);
		}
		if (executeImmediately) {
			callback();
		}
	},

	subscribeObservable: <T>(
		selv: ComponentEventsPropMacros,
		observable: ReadonlyObservableValue<T>,
		callback: (value: T, prev: T) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void => {
		selv.subscribe(observable.changed, callback);
		if (executeOnEnable) {
			selv.onEnable(() => callback(observable.get(), observable.get()), executeImmediately);
		}
	},

	subscribeCollection: <T extends defined>(
		selv: ComponentEventsPropMacros,
		observable: ReadonlyObservableCollection<T>,
		callback: (update: CollectionChangedArgs<T>) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void => {
		selv.subscribe(observable.collectionChanged, callback);
		if (executeOnEnable) {
			selv.onEnable(() => callback({ kind: "add", added: observable.getArr() }), executeImmediately);
		}
	},

	subscribeCollectionAdded: <T extends defined>(
		selv: ComponentEventsPropMacros,
		observable: ReadonlyObservableCollection<T>,
		callback: (item: T) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void => {
		selv.subscribeCollection(
			observable,
			(update) => {
				if (update.kind !== "add") return;
				for (const item of update.added) {
					callback(item);
				}
			},
			executeOnEnable,
			executeImmediately,
		);
	},

	subscribeMap: <K extends defined, V extends defined>(
		selv: ComponentEventsPropMacros,
		observable: ReadonlyObservableMap<K, V>,
		callback: (key: K, value: V | undefined) => void,
		executeOnEnable = false,
		executeImmediately = false,
	): void => {
		selv.subscribe(observable.changed, callback);

		if (executeOnEnable) {
			selv.onEnable(() => {
				for (const [k, v] of observable.getAll()) {
					callback(k, v);
				}
			}, executeImmediately);
		}
	},

	readonlyObservableFromInstanceParam: <TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		selv: ComponentEventsPropMacros,
		instance: TInstance,
		param: TParam,
	): ReadonlyObservableValue<TInstance[TParam]> => {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		selv.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));

		return observable;
	},

	observableFromInstanceParam: <TInstance extends Instance, TParam extends InstancePropertyNames<TInstance>>(
		selv: ComponentEventsPropMacros,
		instance: TInstance,
		param: TParam,
	): ObservableValue<TInstance[TParam]> => {
		const observable = new ObservableValue<TInstance[TParam]>(instance[param]);
		selv.subscribe(instance.GetPropertyChangedSignal(param), () => observable.set(instance[param]));
		selv.subscribeObservable(observable, (value) => (instance[param] = value), true);

		return observable;
	},

	observableFromAttribute: <TType extends AttributeValue>(
		selv: ComponentEventsPropMacros,
		instance: Instance,
		name: string,
	): ObservableValue<TType | undefined> => {
		const observable = new ObservableValue<TType | undefined>(instance.GetAttribute(name) as TType | undefined);
		selv.subscribe(instance.GetAttributeChangedSignal(name), () =>
			observable.set(instance.GetAttribute(name) as TType | undefined),
		);
		selv.subscribeObservable(observable, (value) => instance.SetAttribute(name, value));

		return observable;
	},

	observableFromAttributeJson: <TType>(
		selv: ComponentEventsPropMacros,
		instance: Instance,
		name: string,
	): ObservableValue<TType | undefined> => {
		const json = instance.GetAttribute(name) as string | undefined;
		const observable = new ObservableValue<TType | undefined>(
			json !== undefined ? JSON.deserialize<TType>(json) : undefined,
		);

		selv.subscribe(instance.GetAttributeChangedSignal(name), () => {
			const json = instance.GetAttribute(name) as string | undefined;
			const val = json !== undefined ? JSON.deserialize<TType>(json) : undefined;

			observable.set(val);
		});
		selv.subscribeObservable(
			observable,
			(value) => instance.SetAttribute(name, value === undefined ? undefined : JSON.serialize(value)),
			true,
		);

		return observable;
	},

	loop: (selv: ComponentEventsPropMacros, interval: number, func: (dt: number) => void): SignalConnection => {
		let stop = false;

		task.spawn(() => {
			let dt = 0;
			while (true as boolean) {
				if (selv.state.isDestroyed()) return;
				if (stop) return;

				if (selv.state.isEnabled()) {
					func(dt);
				}

				dt = task.wait(interval);
			}
		});

		return {
			Disconnect() {
				stop = true;
			},
		};
	},
};
