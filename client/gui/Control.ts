import { ClientInstanceComponent } from "engine/client/component/ClientInstanceComponent";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** A component that is a GUI element */
export class Control<T extends GuiObject = GuiObject> extends ClientInstanceComponent<T> {
	private visible: boolean;
	protected readonly gui: T;

	constructor(instance: T) {
		super(instance);

		this.gui = instance;
		this.visible = instance.Visible;
	}

	/** Alias for this.parent() */
	add<T extends InstanceComponent<GuiObject>>(child: T): T {
		return this.parent(child);
	}

	override parent<T extends InstanceComponent<Instance> | Component | IDebuggableComponent>(child: T): T {
		child = super.parent(child);

		if ("instance" in child) {
			ComponentInstance.setParentIfNeeded(child.instance, this.instance);

			if (child.instance.IsA("GuiObject")) {
				child.instance.LayoutOrder = this.getParented().size();
			}
		}

		return child;
	}

	override enable() {
		if (!this.isVisible()) return;
		super.enable();
	}

	/** Is control visible */
	isVisible() {
		return this.visible;
	}

	/** Show the control and enable it with the children */
	show() {
		this.visible = true;
		this.setInstanceVisibilityFunction(true);

		this.enable();
	}
	protected setInstanceVisibilityFunction(visible: boolean) {
		this.instance.Visible = visible;
	}

	/** Hide the control and disable it with the children */
	hide() {
		this.visible = false;
		this.setInstanceVisibilityFunction(false);

		this.disable();
	}

	readonly setVisible = (visible: boolean) => (visible ? this.show() : this.hide());
}
