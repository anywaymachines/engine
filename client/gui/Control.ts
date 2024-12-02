import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ObservableSwitch } from "engine/shared/event/ObservableSwitch";

export class Control<T extends GuiObject = GuiObject> extends InstanceComponent<T> {
	readonly isVisible: ObservableSwitch;
	protected readonly gui: T;

	constructor(instance: T, config?: { showOnEnable?: boolean }) {
		super(instance);

		this.gui = instance;
		this.isVisible = this.visibilityComponent().visibility;

		if (config?.showOnEnable ?? false) {
			this.visibilityComponent().initShowOnEnable();
		}
	}

	/** Alias for this.parent(); Do not override. */
	add<T extends InstanceComponent<Instance>>(child: T): T {
		return this.parent(child);
	}
}
