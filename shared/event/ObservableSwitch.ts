import { ArgsSignal } from "engine/shared/event/Signal";

interface ObservableSwitchBase extends ReadonlyObservableValueBase<boolean> {
	set(key: string | object, enabled: boolean): void;
}
interface ObservableSwitch extends ObservableSwitchBase, ReadonlyObservableValue<boolean> {}

class _ObservableSwitch implements ObservableSwitchBase {
	readonly changed = new ArgsSignal<[value: boolean, prev: boolean]>();
	private overrides?: Set<string | object>;

	constructor(readonly defaultValue: boolean = true) {}

	get(): boolean {
		return !this.overrides || this.overrides.size() === 0;
	}

	set(key: string | object, enabled: boolean): void {
		const prev = this.get();

		if (enabled !== this.defaultValue) {
			this.overrides ??= new Set();
			this.overrides.add(key);
		} else {
			this.overrides?.delete(key);
		}

		const value = this.get();
		if (value !== prev) {
			this.changed.Fire(value, prev);
		}
	}
}

export const ObservableSwitch = _ObservableSwitch as unknown as new (defaultValue?: boolean) => ObservableSwitch;
