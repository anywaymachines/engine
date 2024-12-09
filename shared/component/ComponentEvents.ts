import { EventHandler } from "engine/shared/event/EventHandler";
import type { Component } from "engine/shared/component/Component";

/** Event handler with the ability to disable event processing */
export class ComponentEvents {
	readonly eventHandler = new EventHandler();

	constructor(readonly state: Component) {
		state.onDisable(() => this.eventHandler.unsubscribeAll());
	}
}
