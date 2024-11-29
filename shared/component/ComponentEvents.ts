import { EventHandler } from "engine/shared/event/EventHandler";
import type { Component2 } from "engine/shared/component/Component2";

export type { _ComponentEvents as _ComponentEvents2 };
/** @deprecated Internal use only */
class _ComponentEvents {
	readonly eventHandler = new EventHandler();

	constructor(readonly state: Component2) {
		state.onDisable(() => this.eventHandler.unsubscribeAll());
	}
}

/** Event handler with the ability to disable event processing */
export interface ComponentEvents extends ComponentEvents2PropMacros {}
export class ComponentEvents extends _ComponentEvents {}
