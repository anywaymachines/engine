import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { ComponentEvents } from "engine/shared/component/ComponentEvents";

/** Represents an action that can be executed. */
export class Action {
	readonly canExecute = new ObservableSwitchAnd(false);
	private readonly action = new ArgsSignal();

	constructor(func?: () => void) {
		if (func) {
			this.subscribe(func);
		}
	}

	/** Executes the action if it can be executed. */
	execute(): void {
		if (!this.canExecute.get()) return;
		this.action.Fire();
	}

	subscribe(func: () => void): SignalConnection {
		return this.action.Connect(func);
	}

	subCanExecuteFrom(
		events: ComponentEvents,
		values: { readonly [k in string]: ReadonlyObservableValue<boolean> },
	): void {
		this.canExecute.subscribeFrom(events, values);
	}
}
