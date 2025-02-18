import { Component } from "engine/shared/component/Component";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

/** Represents an action that can be executed by a player using a GuiButton or a key. */
export class Action<TArgs extends unknown[] = []> extends Component {
	readonly canExecute = new OverlayValueStorage<boolean>(false, true);
	private readonly action = new ArgsSignal<TArgs>();

	constructor(func?: (...args: TArgs) => void) {
		super();

		this.subCanExecuteFrom({ mainEnabled_$: this.enabledState });

		if (func) {
			this.subscribe(func);
		}
	}

	/** Executes the action if it can be executed. */
	execute(...args: TArgs): void {
		if (!this.canExecute.get()) return;
		this.action.Fire(...args);
	}

	/** Subscribes a function to the action. */
	subscribe(func: (...args: TArgs) => void): SignalConnection {
		return this.action.Connect(func);
	}

	/** Adds checks to the action's can execute state. Returns this; */
	subCanExecuteFrom(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): this {
		for (const [k, v] of pairs(values)) {
			this.canExecute.and(k, v);
		}

		return this;
	}
}
