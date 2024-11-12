import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";

/** Component with an `Instance` */
export class InstanceComponent<T extends Instance> extends Component {
	readonly instance;

	constructor(instance: T, destroyComponentOnInstanceDestroy = true, destroyInstanceOnComponentDestroy = true) {
		super();
		this.instance = instance;

		ComponentInstance.init(this, instance, destroyComponentOnInstanceDestroy, destroyInstanceOnComponentDestroy);
	}

	/** Checks if the child exists on an Instance */
	protected static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}
	protected static findFirstChild<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): T[TKey] | undefined {
		return gui.FindFirstChild(name) as T[TKey] | undefined;
	}
	protected static waitForChild<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): T[TKey] & defined {
		return gui.WaitForChild(name) as defined as T[TKey] & defined;
	}

	/** Get an attribute value on the Instance */
	getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}
}
