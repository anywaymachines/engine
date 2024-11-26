import { ArgsSignal } from "engine/shared/event/Signal";

interface ObservableSwitchBase extends ReadonlyObservableValueBase<boolean> {
	getKeyed(key: string | object): boolean;
	set(key: string | object, enabled: boolean): void;
}
export interface ObservableSwitch extends ObservableSwitchBase, ReadonlyObservableValue<boolean> {}

class _ObservableSwitch implements ObservableSwitchBase, ReadonlyObservableValueBase<boolean> {
	private readonly _changed = new ArgsSignal<[value: boolean, prev: boolean]>();
	readonly changed: ReadonlyArgsSignal<[value: boolean, prev: boolean]> = this._changed;

	private trueValues?: Set<string | object>;
	private falseValues?: Set<string | object>;
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

	getKeyed(key: string | object): boolean {
		if (this.trueValues?.has(key)) return true;
		if (this.falseValues?.has(key)) return false;
		return this.defaultValue;
	}

	set(key: string | object, enabled: boolean): void {
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
}

export const ObservableSwitch = _ObservableSwitch as unknown as new (defaultValue?: boolean) => ObservableSwitch;
export const ObservableSwitchAnd = {
	new: (defaultValue?: boolean) => new _ObservableSwitch(true, defaultValue),
} as unknown as new (defaultValue?: boolean) => ObservableSwitch;
export const ObservableSwitchOr = {
	new: (defaultValue?: boolean) => new _ObservableSwitch(false, defaultValue),
} as unknown as new (defaultValue?: boolean) => ObservableSwitch;
