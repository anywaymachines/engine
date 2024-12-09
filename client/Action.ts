import { Component } from "engine/shared/component/Component";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import { ArgsSignal } from "engine/shared/event/Signal";

/** Represents an action that can be executed by a player using a GuiButton or a key. */
export class Action extends Component {
	readonly canExecute = new OverlayValueStorage<boolean>(false, true);
	private readonly action = new ArgsSignal();

	constructor(func?: () => void) {
		super();

		this.subCanExecuteFrom({ mainEnabled_$: this.enabledState });

		if (func) {
			this.subscribe(func);
		}
	}

	/** Executes the action if it can be executed. */
	execute(): void {
		if (!this.canExecute.get()) return;
		this.action.Fire();
	}

	/** Subscribes a function to the action. */
	subscribe(func: () => void): SignalConnection {
		return this.action.Connect(func);
	}

	/** Adds checks to the action's can execute state. */
	subCanExecuteFrom(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): void {
		for (const [k, v] of pairs(values)) {
			this.canExecute.and(k, v);
		}
	}
}
