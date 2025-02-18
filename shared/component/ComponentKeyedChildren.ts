import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Objects } from "engine/shared/fixes/Objects";
import type { DebuggableComponent } from "engine/shared/component/Component";

/** Stores keyed components. Handles its enabling, disabling and destroying. */
export class ComponentKeyedChildren<TKey extends defined, T extends Component = Component>
	extends Component
	implements DebuggableComponent
{
	private readonly children = new Map<TKey, T>();
	private clearing = false;

	constructor(clearOnDisable = false) {
		super();

		this.onEnable(() => {
			if (!this.children) return;

			for (const [_, child] of this.children) {
				child.enable();
			}
		});
		this.onDestroy(() => this.clear());

		if (!clearOnDisable) {
			this.onDisable(() => {
				if (!this.children) return;

				for (const [_, child] of this.children) {
					child.disable();
				}
			});
		} else {
			this.onDisable(() => this.clear());
		}
	}

	private parentInstance?: Instance;
	withParentInstance(parentInstance: Instance): this {
		if (this.parentInstance) {
			throw "Instance already set";
		}

		this.parentInstance = parentInstance;
		return this;
	}

	getDebugChildren(): readonly T[] {
		if (!this.children) return Objects.empty;
		return [...this.children].map((e) => e[1]);
	}

	getAll(): ReadonlyMap<TKey, T> {
		return this.children;
	}
	protected override getChildrenForInjecting(): readonly Component[] {
		return [...super.getChildrenForInjecting(), ...this.getAll().values()];
	}

	get(key: TKey): T | undefined {
		return this.children.get(key);
	}

	add<TChild extends T>(key: TKey, child: TChild, throwIfExists = false): TChild {
		if (throwIfExists && this.children?.has(key)) {
			throw `Child with the key ${key} already exists`;
		}

		this.children.set(key, child);

		if (this.isEnabled()) {
			child.enable();
		}

		child.onDestroy(() => {
			if (this.clearing) return;
			this.remove(key);
		});

		if (this.parentInstance && ComponentInstance.isInstanceComponent(child)) {
			ComponentInstance.setParentIfNeeded(child.instance, this.parentInstance);
		}

		this.tryProvideDIToChild(child);
		return child;
	}

	remove(key: TKey) {
		const child = this.children.get(key);
		if (!child) return;

		this.children.delete(key);
		child.destroy();
	}

	clear() {
		this.clearing = true;
		for (const [key, child] of this.children) {
			child.destroy();
		}

		this.children.clear();
		this.clearing = false;
	}
}
