import { Component } from "engine/shared/component/Component";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";

/** Component that wraps another Component's enabled state and controls it via ObservableSwitch. */
export class ComponentStateContainer extends Component {
	/** Creates a ComponentStateContainer, parents it to the provided parent and returns its enabled ObservableSwitch. */
	static create(parent: Component, child: Component): OverlayValueStorage<boolean> {
		const container = parent.parent(new ComponentStateContainer(child));
		return container.enabled;
	}

	readonly enabled: OverlayValueStorage<boolean> = OverlayValueStorage.bool();

	constructor(child: Component) {
		super();

		this.onEnabledStateChange((enabled) => this.enabled.and("main$parent", enabled), true);

		this.parent(child, { disable: false, enable: false });
		this.event.subscribeObservable(this.enabled, (enabled) => child.setEnabled(enabled), true);
	}
}
