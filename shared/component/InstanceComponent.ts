import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import type { ComponentConfig, ComponentParentConfig } from "engine/shared/component/Component";

export interface InstanceComponentConfig extends ComponentConfig {
	readonly destroyComponentOnInstanceDestroy?: boolean;
	readonly destroyInstanceOnComponentDestroy?: boolean;
}
export interface InstanceComponentParentConfig extends ComponentParentConfig {
	readonly parent: boolean;
}

export type { _InstanceComponent };
/** @deprecated Internal use only */
class _InstanceComponent<T extends Instance> extends Component {
	constructor(
		readonly instance: T,
		config?: InstanceComponentConfig,
	) {
		super(config);

		ComponentInstance.init(
			this,
			instance,
			config?.destroyComponentOnInstanceDestroy,
			config?.destroyInstanceOnComponentDestroy,
		);
	}

	/** Return a function that returns a copy of the provided Instance. Destroys the Instance if specified. Leaks the memory, use only in static context. */
	static asTemplateWithMemoryLeak<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}
	/** Checks if the child exists on an Instance */
	static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}
	static findFirstChild<T extends Instance, TKey extends keyof T & string>(gui: T, name: TKey): T[TKey] | undefined {
		return gui.FindFirstChild(name) as T[TKey] | undefined;
	}
	static waitForChild<T extends Instance, TKey extends keyof T & string>(gui: T, name: TKey): T[TKey] & defined {
		return gui.WaitForChild(name) as defined as T[TKey] & defined;
	}

	override parent<T extends Component>(child: T, config?: InstanceComponentParentConfig): T {
		if (config?.parent ?? true) {
			ComponentInstance.setInstanceParentIfNeeded(child, this);
		}
		if (ComponentInstance.isInstanceComponent(child)) {
			if (child.instance.IsA("GuiObject") && child.instance.LayoutOrder === 0) {
				child.instance.LayoutOrder = this.instance.GetChildren().size();
			}
		}

		return super.parent(child, config);
	}
}

export interface InstanceComponent<T extends Instance> extends InstanceComponentPropMacros<T> {}
export class InstanceComponent<T extends Instance> extends _InstanceComponent<T> {}
