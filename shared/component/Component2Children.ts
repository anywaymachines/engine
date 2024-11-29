import { Component2 } from "engine/shared/component/Component2";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import type { DebuggableComponent } from "engine/shared/component/Component2";

export interface ReadonlyComponentChildren<T extends Component2 = Component2> extends Component2 {
	getAll(): readonly T[];
}

/** Stores components. Handles its enabling, disabling and destroying. */
export class Component2Children<T extends Component2 = Component2>
	extends Component2
	implements ReadonlyComponentChildren<T>
{
	private readonly children: T[] = [];
	private clearing = false;

	constructor(clearOnDisable: boolean = false) {
		super();

		this.onEnable(() => {
			for (const child of this.children) {
				child.enable();
			}
		});
		this.onDestroy(() => this.clear());

		if (!clearOnDisable) {
			this.onDisable(() => {
				for (const child of this.children) {
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

	getAll(): readonly T[] {
		return this.children;
	}

	add<TChild extends T>(child: TChild): TChild {
		this.children.push(child);

		if (this.isEnabled()) {
			child.enable();
		}

		child.onDestroy(() => {
			if (this.clearing) return;
			this.remove(child);
		});

		if (this.parentInstance && ComponentInstance.isInstanceComponent(child)) {
			ComponentInstance.setParentIfNeeded(child.instance, this.parentInstance);
		}

		return child;
	}

	remove(child: T) {
		const index = this.children.indexOf(child);
		if (index === -1) return;

		this.children.remove(index);
		child.destroy();
	}

	clear() {
		this.clearing = true;
		for (const child of this.children) {
			child.destroy();
		}

		this.children.clear();
		this.clearing = false;
	}

	override getDebugChildren(): readonly DebuggableComponent[] {
		return [...this.getAll(), ...super.getDebugChildren()];
	}
}
