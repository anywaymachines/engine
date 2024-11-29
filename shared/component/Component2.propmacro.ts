import type { _Component2, Component2 } from "engine/shared/component/Component2";
import type { _InstanceComponent2 } from "engine/shared/component/InstanceComponent2";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [BaseComponent2Macros, Component2Macros, InstanceComponent2Macros];

//

declare global {
	interface Component2PropMacros extends _Component2 {
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
export const BaseComponent2Macros: PropertyMacros<Component2PropMacros> = {
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
	interface Component2PropMacros extends _Component2 {
		/** Executes a function on `this` and returns `this` */
		with(func: (selv: this) => void): this;

		/** Parents a child component to `this` and returns `this`  */
		withParented(child: Component2): this;

		/** Return a function that returns a copy of the provided Instance; Destroys the original if specified */
		asTemplate<T extends Instance>(object: T, destroyOriginal?: boolean): () => T;
	}
}
export const Component2Macros: PropertyMacros<Component2PropMacros> = {
	with: <T extends Component2PropMacros>(selv: T, func: (selv: T) => void): T => {
		func(selv);
		return selv;
	},
	withParented: <T extends Component2PropMacros>(selv: T, child: Component2): T => {
		(selv as unknown as Component2).parent(child);
		return selv;
	},
	asTemplate: <T extends Instance>(selv: Component2PropMacros, object: T, destroyOriginal = true): (() => T) => {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();
		selv.onDestroy(() => template.Destroy());

		return () => template.Clone();
	},
};

//

declare global {
	interface InstanceComponent2PropMacros<T extends Instance> extends _InstanceComponent2<T> {
		/** Get an attribute value on the Instance */
		getAttribute<T extends AttributeValue>(name: string): T | undefined;

		/** Parents a child component to `this` and returns `this`  */
		withParentedWithInstance(func: (instance: T) => Component2): this;
	}
}
export const InstanceComponent2Macros: PropertyMacros<InstanceComponent2PropMacros<Instance>> = {
	/** Get an attribute value on the Instance */
	getAttribute: <T extends AttributeValue>(selv: InstanceComponent2PropMacros<Instance>, name: string) =>
		selv.instance.GetAttribute(name) as T | undefined,

	withParentedWithInstance: (selv, func) => {
		return selv.withParented(func(selv.instance));
	},
};
