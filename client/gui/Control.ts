import { ClientInstanceComponent } from "engine/client/component/ClientInstanceComponent";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** A {@link GuiObject} component that can be hidden or shown */
export class Control<T extends GuiObject = GuiObject> extends ClientInstanceComponent<T> {
	protected readonly gui: T;

	constructor(instance: T) {
		super(instance);
		this.gui = instance;
	}

	/** Alias for this.parent() */
	add<T extends InstanceComponent<GuiObject>>(child: T): T {
		return this.parent(child);
	}

	isInstanceVisible(): boolean {
		return this.instance.Visible;
	}
	setInstanceVisibility(visible: boolean): void {
		this.instance.Visible = visible;
	}

	/** Enable and show */
	enableShow(): void {
		this.enable();
		this.setInstanceVisibility(true);
	}
	/** Disable and hide  */
	disableHide(): void {
		this.disable();
		this.setInstanceVisibility(false);
	}
	setEnabledAndVisible(enabled: boolean): void {
		if (enabled) {
			this.enableShow();
		} else {
			this.disableHide();
		}
	}

	/** Setup the control to be shown when enabled and hidden when disabled  */
	setupShowOnEnable(): this {
		this.onEnabledStateChange((enabled) => this.setInstanceVisibility(enabled), true);
		return this;
	}
}
