import { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";

export interface ReadonlyComponentDisabler<TItem extends defined> {
	isEnabled(item: TItem): boolean;
	isDisabled(item: TItem): boolean;
}

export class ComponentDisabler<TItem extends defined> implements ReadonlyComponentDisabler<TItem> {
	private readonly _updated = new ArgsSignal();
	readonly updated = this._updated.asReadonly();

	// The base value for the enabled check
	private readonly base = new ObservableValue(true);
	// Overridden values for the enabled check; in this collection, any item's enabled status is the opposite of the base status
	private readonly overridden = new ObservableCollectionSet<TItem>();

	asReadonly(): ReadonlyComponentDisabler<TItem> {
		return this;
	}

	isEnabled(item: TItem) {
		return this.base.get() ? !this.overridden.has(item) : this.overridden.has(item);
	}
	isDisabled(item: TItem) {
		return !this.isEnabled(item);
	}

	/** Enable/disable items */
	set(enabled: boolean, ...items: readonly TItem[]) {
		if (enabled) this.enable(...items);
		else this.disable(...items);
	}

	enableAll() {
		this.base.set(true);
		this.overridden.clear();

		this._updated.Fire();
	}
	disableAll() {
		this.base.set(false);
		this.overridden.clear();

		this._updated.Fire();
	}

	enable(...items: readonly TItem[]) {
		if (this.base.get()) {
			this.overridden.remove(...items);
		} else {
			this.overridden.add(...items);
		}

		this._updated.Fire();
	}
	disable(...items: readonly TItem[]) {
		if (!this.base.get()) {
			this.overridden.remove(...items);
		} else {
			this.overridden.add(...items);
		}

		this._updated.Fire();
	}

	enableOnly(...items: readonly TItem[]) {
		this.base.set(false);
		this.overridden.setRange(items);

		this._updated.Fire();
	}
	disableOnly(...items: readonly TItem[]) {
		this.base.set(true);
		this.overridden.setRange(items);

		this._updated.Fire();
	}
}
