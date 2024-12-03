import { ArgsSignal } from "engine/shared/event/Signal";
import type { ComponentEvents } from "engine/shared/component/ComponentEvents";

export type ObservableSwitchKey = string | object | number;

interface ObservableSwitchBase extends ReadonlyObservableValueBase<boolean> {
	getKeyed(key: ObservableSwitchKey): boolean;
	set(key: ObservableSwitchKey, enabled: boolean): void;
	subscribeFrom(events: ComponentEvents, values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): void;

	switch(key: ObservableSwitchKey): void;
}
export interface ObservableSwitch extends ObservableSwitchBase, ReadonlyObservableValue<boolean> {}

class _ObservableSwitch implements ObservableSwitchBase, ReadonlyObservableValueBase<boolean> {
	private readonly _changed = new ArgsSignal<[value: boolean, prev: boolean]>();
	readonly changed: ReadonlyArgsSignal<[value: boolean, prev: boolean]> = this._changed;

	private trueValues?: Set<ObservableSwitchKey>;
	private falseValues?: Set<ObservableSwitchKey>;
	private readonly defaultValue: boolean;

	constructor(
		private readonly isAnd: boolean = true,
		defaultValue?: boolean,
	) {
		this.defaultValue = defaultValue ?? isAnd;
	}

	get(): boolean {
		const falses = this.falseValues?.size() ?? 0;
		const trues = this.trueValues?.size() ?? 0;
		if (falses === 0 && trues === 0) {
			return this.defaultValue;
		}

		if (this.isAnd) {
			return falses === 0;
		} else {
			return trues !== 0;
		}
	}

	subscribeFrom(events: ComponentEvents, values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): void {
		for (const [k, v] of pairs(values)) {
			events.subscribeObservable(v, (enabled) => this.set(k, enabled), true, true);
		}
	}

	getKeyed(key: ObservableSwitchKey): boolean {
		if (this.trueValues?.has(key)) return true;
		if (this.falseValues?.has(key)) return false;
		return this.defaultValue;
	}

	set(key: ObservableSwitchKey, enabled: boolean): void {
		const prev = this.get();

		if (enabled) {
			this.falseValues?.delete(key);

			this.trueValues ??= new Set();
			this.trueValues.add(key);
		} else {
			this.trueValues?.delete(key);

			this.falseValues ??= new Set();
			this.falseValues.add(key);
		}

		const value = this.get();
		if (value !== prev) {
			this._changed.Fire(value, prev);
		}
	}

	switch(key: ObservableSwitchKey): void {
		this.set(key, !this.getKeyed(key));
	}
}

export const ObservableSwitch = _ObservableSwitch as unknown as new (defaultValue?: boolean) => ObservableSwitch;
export const ObservableSwitchAnd = {
	new: (defaultValue?: boolean) => new _ObservableSwitch(true, defaultValue),
} as unknown as new (defaultValue?: boolean) => ObservableSwitch;
export const ObservableSwitchOr = {
	new: (defaultValue?: boolean) => new _ObservableSwitch(false, defaultValue),
} as unknown as new (defaultValue?: boolean) => ObservableSwitch;
