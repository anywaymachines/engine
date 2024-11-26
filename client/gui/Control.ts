import { ClientInstanceComponent } from "engine/client/component/ClientInstanceComponent";
import { VisibilityComponent } from "engine/shared/component/VisibilityComponent";
import type { ObservableSwitch } from "engine/shared/event/ObservableSwitch";

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

/** A {@link GuiObject} component that can be hidden or shown */
export class Control2<T extends GuiObject = GuiObject> extends ClientInstanceComponent<T> {
	readonly isVisible: ObservableSwitch;
	protected readonly gui: T;
	private readonly visibility;

	constructor(instance: T, config?: { showOnEnable?: boolean }) {
		super(instance);

		this.gui = instance;

		this.visibility = new VisibilityComponent(this);
		this.isVisible = this.visibility.visibility;

		if (config?.showOnEnable ?? false) {
			this.visibility.initShowOnEnable();
		}
	}

	/** Alias for this.parent(); Do not override. */
	add<T extends InstanceComponent<GuiObject>>(child: T): T {
		return this.parent(child);
	}

	/** Sets the visibility and the enabled state of the component */
	setVisibilityAndState(enabled: boolean, key?: string | object): void {
		this.visibility.setVisible(enabled, key);
		this.setEnabled(enabled);
	}
}
