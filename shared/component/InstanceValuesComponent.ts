import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import { EventHandler } from "engine/shared/event/EventHandler";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** Stores Instance properties, provides methods to change them, with native support for transforms */
export class InstanceValuesComponent<T extends Instance> implements ComponentTypes.DestroyableComponent {
	private readonly values = new Map<string, OverlayValueStorage<unknown>>();
	private readonly instance: T;
	private readonly eventHandler = new EventHandler();

	constructor(component: InstanceComponent<T>) {
		this.instance = component.instance;

		component.onEnable(() => {
			for (const [, v] of this.values) {
				v.finishTransforms();
			}
		});
	}

	get<const K extends keyof T & string>(key: K): OverlayValueStorage<T[K]> {
		const existing = this.values.get(key);
		if (existing) return existing as unknown as OverlayValueStorage<T[K]>;

		const part = new OverlayValueStorage(this.instance[key]);
		this.eventHandler.register(part.subscribe((v) => (this.instance[key] = v)));
		this.values.set(key, part as OverlayValueStorage<unknown>);

		return part;
	}

	destroy(): void {
		this.eventHandler.unsubscribeAll();

		for (const [, value] of this.values) {
			value.destroy();
		}
		this.values.clear();
	}
}
