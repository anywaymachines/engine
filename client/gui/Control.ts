import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { InstanceComponentConfig } from "engine/shared/component/InstanceComponent";

export interface ControlConfig extends InstanceComponentConfig {
	readonly showOnEnable?: boolean;
}
export class Control<T extends GuiObject = GuiObject> extends InstanceComponent<T> {
	protected readonly gui: T;

	constructor(instance: T, config?: ControlConfig) {
		super(instance);

		this.gui = instance;
		if (config?.showOnEnable ?? false) {
			this.visibilityComponent().initShowOnEnable();
		}
	}

	/** Alias for this.parent(); Do not override. */
	add<T extends InstanceComponent<Instance>>(child: T): T {
		return this.parent(child);
	}
}
