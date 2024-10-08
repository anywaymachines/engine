import { InputHandler } from "engine/client/event/InputHandler";
import { InputController } from "engine/client/InputController";
import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import type { EventHandler } from "engine/shared/event/EventHandler";

export class ClientComponentEvents extends ComponentEvents {
	readonly inputHandler = new InputHandler();

	constructor(state: IComponent | (IReadonlyDestroyableComponent & IReadonlyEnableableComponent)) {
		super(state);

		if ("onDisable" in state) {
			state.onDisable(() => this.inputHandler.unsubscribeAll());
		}
		state.onDestroy(() => this.inputHandler.destroy());

		if ("disable" in state) {
			this.subscribeObservable(InputController.inputType, () => {
				state.disable();
				state.enable();
			});
		}
	}

	/** Register an event that fires on enable and input type change */
	onPrepare(callback: (inputType: InputType, eventHandler: EventHandler, inputHandler: InputHandler) => void): void {
		this.onEnable(() => callback(InputController.inputType.get(), this.eventHandler, this.inputHandler));
	}

	/** Register an event that fires on enable and input type change to Desktop */
	onPrepareDesktop(callback: () => void): void {
		this.onPrepare((inputType) => {
			if (inputType !== "Desktop") return;
			callback();
		});
	}
	/** Register an event that fires on enable and input type change to Touch */
	onPrepareTouch(callback: () => void): void {
		this.onPrepare((inputType) => {
			if (inputType !== "Touch") return;
			callback();
		});
	}
	/** Register an event that fires on enable and input type change to Gamepad */
	onPrepareGamepad(callback: () => void): void {
		this.onPrepare((inputType) => {
			if (inputType !== "Gamepad") return;
			callback();
		});
	}

	/** Register an InputBegan event */
	onInputBegin(callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onInputBegan(callback));
	}
	/** Register an InputEnded event */
	onInputEnd(callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onInputEnded(callback));
	}
	/** Register an InputBegan event, filtered by a keyboard key */
	onKeyDown(key: KeyCode, callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onKeyDown(key, callback));
	}
	/** Register an InputEnded event, filtered by a keyboard key */
	onKeyUp(key: KeyCode, callback: (input: InputObject) => void) {
		this.subInput((ih) => ih.onKeyUp(key, callback));
	}
	subInput(setup: (inputHandler: InputHandler) => void) {
		this.onEnable(() => setup(this.inputHandler));
	}
}
