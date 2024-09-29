import { ClientComponentEvents } from "engine/client/component/ClientComponentEvents";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import type { InputHandler, ReadonlyInputHandler } from "engine/client/event/InputHandler";
import type { EventHandler } from "engine/shared/event/EventHandler";

/** @inheritdoc */
export class ClientComponent extends Component {
	readonly event = new ClientComponentEvents(this);

	/** Input handler for use in prepare***() */
	protected readonly inputHandler: ReadonlyInputHandler;

	constructor() {
		super();

		this.inputHandler = this.event.inputHandler;
		this.onEnable(() => this.prepare());
	}

	protected onPrepare(
		callback: (inputType: InputType, eventHandler: EventHandler, inputHandler: InputHandler) => void,
	) {
		this.event.onPrepare(callback);
	}

	/** Prepare the functionality for Desktop */
	protected prepareDesktop(): void {}
	/** Prepare the functionality for Touch */
	protected prepareTouch(): void {}
	/** Prepare the functionality for Gamepad */
	protected prepareGamepad(): void {}

	/** Prepare the functionality (**Unsubscribes from every event and input handler**) */
	protected prepare(): void {
		const inputType = InputController.inputType.get();
		if (inputType === "Desktop") this.prepareDesktop();
		else if (inputType === "Touch") this.prepareTouch();
		else if (inputType === "Gamepad") this.prepareGamepad();
	}
}