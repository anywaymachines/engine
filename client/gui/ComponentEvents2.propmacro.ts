import { InputHandler } from "engine/client/event/InputHandler";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import type { _ComponentEvents2 } from "engine/shared/component/ComponentEvents";
import type { EventHandler } from "engine/shared/event/EventHandler";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentEvents2Macros];

//

class InputHandlerComponent extends Component {
	readonly inputHandler = new InputHandler();

	constructor(parent: Component) {
		super();

		parent.onDisable(() => this.inputHandler.unsubscribeAll());
		parent.onDestroy(() => this.inputHandler.destroy());

		this.event.subscribeObservable(InputController.inputType, () => {
			parent.disable();
			parent.enable();
		});
	}
}

declare global {
	interface ComponentEvents2PropMacros extends _ComponentEvents2 {
		/** Register an event that fires on enable and input type change
		 * @client
		 */
		onPrepare(
			callback: (inputType: InputType, eventHandler: EventHandler, inputHandler: InputHandler) => void,
		): void;

		/** Register an event that fires on enable and input type change to Desktop */
		onPrepareDesktop(callback: (eventHandler: EventHandler, inputHandler: InputHandler) => void): void;

		/** Register an event that fires on enable and input type change to Touch */
		onPrepareTouch(callback: (eventHandler: EventHandler, inputHandler: InputHandler) => void): void;

		/** Register an event that fires on enable and input type change to Gamepad */
		onPrepareGamepad(callback: (eventHandler: EventHandler, inputHandler: InputHandler) => void): void;

		/** Register an InputBegan event */
		onInputBegin(callback: (input: InputObject) => void): void;

		/** Register an InputEnded event */
		onInputEnd(callback: (input: InputObject) => void): void;

		/** Register an InputBegan event, filtered by a keyboard key */
		onKeyDown(key: KeyCode, callback: (input: InputObject) => void): void;

		/** Register an InputEnded event, filtered by a keyboard key */
		onKeyUp(key: KeyCode, callback: (input: InputObject) => void): void;

		subInput(setup: (inputHandler: InputHandler, eventHandler: EventHandler) => void): void;
	}
}

const getInputHandler = (component: Component) =>
	component.getOrAddComponent(() => new InputHandlerComponent(component)).inputHandler;

export const ComponentEvents2Macros: PropertyMacros<ComponentEvents2PropMacros> = {
	onPrepare: (
		selv,
		callback: (inputType: InputType, eventHandler: EventHandler, inputHandler: InputHandler) => void,
	): void =>
		selv.onEnable(() => callback(InputController.inputType.get(), selv.eventHandler, getInputHandler(selv.state))),

	onPrepareDesktop: (selv, callback): void => {
		selv.onPrepare((inputType) => {
			if (inputType !== "Desktop") return;
			callback(selv.eventHandler, getInputHandler(selv.state));
		});
	},
	onPrepareTouch: (selv, callback): void => {
		selv.onPrepare((inputType) => {
			if (inputType !== "Touch") return;
			callback(selv.eventHandler, getInputHandler(selv.state));
		});
	},
	onPrepareGamepad: (selv, callback): void => {
		selv.onPrepare((inputType) => {
			if (inputType !== "Gamepad") return;
			callback(selv.eventHandler, getInputHandler(selv.state));
		});
	},

	onInputBegin: (selv, callback: (input: InputObject) => void) => {
		selv.subInput((ih) => ih.onInputBegan(callback));
	},
	onInputEnd: (selv, callback: (input: InputObject) => void) => {
		selv.subInput((ih) => ih.onInputEnded(callback));
	},
	onKeyDown: (selv, key: KeyCode, callback: (input: InputObject) => void) => {
		selv.subInput((ih) => ih.onKeyDown(key, callback));
	},
	onKeyUp: (selv, key: KeyCode, callback: (input: InputObject) => void) => {
		selv.subInput((ih) => ih.onKeyUp(key, callback));
	},
	subInput: (selv, setup) => {
		selv.onEnable(() => setup(getInputHandler(selv.state), selv.eventHandler));
	},
};
