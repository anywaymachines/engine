import type { _Component, Component } from "engine/shared/component/Component";
import type { _InstanceComponent, InstanceComponent } from "engine/shared/component/InstanceComponent";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [BaseComponentMacros, ComponentMacros, InstanceComponentMacros];

//

declare global {
	interface ComponentPropMacros extends _Component {
		isEnabled(): boolean;
		isDestroyed(): boolean;

		enable(): void;
		disable(): void;
		destroy(): void;

		onEnable(func: () => void): void;
		onDisable(func: () => void): void;
		onDestroy(func: () => void): void;
	}
}
export const BaseComponentMacros: PropertyMacros<ComponentPropMacros> = {
	isEnabled: (selv): boolean => selv.state.isEnabled(),
	isDestroyed: (selv): boolean => selv.state.isDestroyed(),
	onEnable: (selv, func): void => selv.state.onEnable(func),
	onDisable: (selv, func): void => selv.state.onDisable(func),
	onDestroy: (selv, func): void => selv.state.onDestroy(func),
	enable: (selv): void => selv.state.enable(),
	disable: (selv): void => selv.state.disable(),
	destroy: (selv): void => selv.state.destroy(),
};

//

declare global {
	interface ComponentPropMacros extends _Component {
		/** Subscribes to the enabled state change event.
		 * @param executeImmediately If true, the function will be called immediately with the current state. False by default
		 */
		onEnabledStateChange(func: (enabled: boolean) => void, executeImmediately?: boolean): void;

		/** Executes a function on `this` and returns `this` */
		with(func: (selv: this) => void): this;

		/** Parents a child component to `this` and returns `this`  */
		withParented(child: Component): this;

		/** Return a function that returns a copy of the provided Instance; Destroys the original if specified */
		asTemplate<T extends Instance>(object: T, destroyOriginal?: boolean): () => T;

		/** Parents a child component to `this` and returns `this` */
		parentGui<T extends InstanceComponent<GuiObject>>(child: T): T;
	}
}
export const ComponentMacros: PropertyMacros<ComponentPropMacros> = {
	onEnabledStateChange: (selv, func, executeImmediately = false) => {
		selv.onEnable(() => func(true));
		selv.onDisable(() => func(false));

		if (executeImmediately) {
			func(selv.isEnabled());
		}
	},
	with: <T extends ComponentPropMacros>(selv: T, func: (selv: T) => void): T => {
		func(selv);
		return selv;
	},
	withParented: <T extends ComponentPropMacros>(selv: T, child: Component): T => {
		(selv as unknown as Component).parent(child);
		return selv;
	},
	asTemplate: <T extends Instance>(selv: ComponentPropMacros, object: T, destroyOriginal = true): (() => T) => {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();
		selv.onDestroy(() => template.Destroy());

		return () => template.Clone();
	},

	parentGui: (selv, child) => {
		(selv as Component).parent(child);
		child.onEnabledStateChange((enabled) => (child.instance.Visible = enabled));

		return child;
	},
};

//

declare global {
	interface InstanceComponentPropMacros<T extends Instance> extends _InstanceComponent<T> {
		/** Get an attribute value on the Instance */
		getAttribute<T extends AttributeValue>(name: string): T | undefined;

		/** Parents a child component to `this` and returns `this` */
		withParentedWithInstance(func: (instance: T) => Component): this;
	}
}
export const InstanceComponentMacros: PropertyMacros<InstanceComponentPropMacros<Instance>> = {
	/** Get an attribute value on the Instance */
	getAttribute: <T extends AttributeValue>(selv: InstanceComponentPropMacros<Instance>, name: string) =>
		selv.instance.GetAttribute(name) as T | undefined,

	withParentedWithInstance: (selv, func) => {
		return selv.withParented(func(selv.instance));
	},
};
