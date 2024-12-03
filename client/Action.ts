import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import { Component } from "engine/shared/component/Component";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { KeybindRegistration } from "client/Keybinds";

/** Represents an action that can be executed by a player using a GuiButton or a key. */
export class Action extends Component {
	readonly canExecute = new ObservableSwitchAnd(false);
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
	subCanExecuteFrom(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): SignalConnection {
		return this.canExecute.subscribeFrom(values);
	}

	initKeybind(keybind: KeybindRegistration, priority?: number) {
		const tooltip = this.parentDestroyOnly(TooltipsHolder.createComponent(keybind.displayPath[0]));
		tooltip.setFromKeybinds(keybind);
		this.canExecute.subscribe((enabled) => tooltip.setEnabled(enabled));

		this.event.subscribeRegistration(() => keybind.onDown(() => this.execute(), priority));
	}
}
