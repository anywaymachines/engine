import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { InstanceComponent2 } from "engine/shared/component/InstanceComponent2";

// declare global {
// 	interface InstanceComponent<T extends Instance = Instance> extends Component, _InstanceComponent<T> {
// 		parent<T extends InstanceComponent<Instance> | Component | IDebuggableComponent | object>(child: T): T;
// 	}
// }

/** Component with an `Instance` */
class _InstanceComponent<T extends Instance = Instance> extends Component {
	readonly instance;

	constructor(instance: T, destroyComponentOnInstanceDestroy = true, destroyInstanceOnComponentDestroy = true) {
		super();
		this.instance = instance;

		ComponentInstance.init(this, instance, destroyComponentOnInstanceDestroy, destroyInstanceOnComponentDestroy);
	}

	/** Parent the child to the component. If the child is an InstanceComponent, parent its instance to this instance. */
	override parent<T extends InstanceComponent<Instance> | Component | IDestroyableComponent>(child: T): T {
		child = super.parent(child);

		if ("instance" in child) {
			ComponentInstance.setParentIfNeeded(child.instance, this.instance);

			if (child.instance.IsA("GuiObject") && child.instance.LayoutOrder === 0) {
				child.instance.LayoutOrder = this.getParented().size();
			}
		}

		return child;
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

	/** Get an attribute value on the Instance */
	getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}
}

// export interface StaticInstanceComponent extends Pick<typeof _InstanceComponent, keyof typeof _InstanceComponent> {
// 	new <T extends Instance>(
// 		instance: T,
// 		destroyComponentOnInstanceDestroy?: boolean,
// 		destroyInstanceOnComponentDestroy?: boolean,
// 	): InstanceComponent<T>;
// }
// export const InstanceComponent = _InstanceComponent as unknown as StaticInstanceComponent;

export type InstanceComponent<T extends Instance> = InstanceComponent2<T>;
export const InstanceComponent = InstanceComponent2;
