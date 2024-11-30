import { Component } from "engine/shared/component/Component";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import type { ObservableSwitch } from "engine/shared/event/ObservableSwitch";

/** Component that wraps another Component's enabled state and controls it via ObservableSwitch. */
export class ComponentStateContainer extends Component {
	/** Creates a ComponentStateContainer, parents it to the provided parent and returns its enabled ObservableSwitch. */
	static create(parent: Component, child: Component): ObservableSwitch {
		const container = parent.parent(new ComponentStateContainer(child));
		return container.enabled;
	}

	readonly enabled = new ObservableSwitchAnd(true);

	constructor(child: Component) {
		super();

		this.onEnabledStateChange((enabled) => this.enabled.set("main$parent", enabled), true);

		this.parent(child, { disable: false, enable: false });
		this.event.subscribeObservable(this.enabled, (enabled) => child.setEnabled(enabled), true);
	}
}
