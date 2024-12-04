import { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ObservableSwitch, ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

const defaultKey = "$main$$";

export class VisibilityComponent implements ComponentTypes.DestroyableComponent {
	private readonly transforming: InstanceValueTransformContainer<boolean>;
	readonly visibility: ObservableSwitch;
	readonly instance: GuiObject;

	constructor(readonly component: InstanceComponent<GuiObject>) {
		this.instance = component.instance;

		this.transforming = new InstanceValueTransformContainer<boolean>(
			component.instance.Visible,
			(value) => (component.instance.Visible = value),
		);
		this.transforming.addTransform((value) => {
			if (!value) return Transforms.create();
			return Transforms.create().show(this.instance);
		});

		this.visibility = new ObservableSwitchAnd(component.instance.Visible);
		this.visibility.subscribe((visible) => this.transforming.value.set(visible));
	}

	waitForTransform(): ITransformBuilder {
		return Transforms.create().waitForTransformOf(this.transforming);
	}

	addTransformFunc(func: (enabling: boolean) => ITransformBuilder): void {
		this.transforming.addTransform(func);
	}
	addTransform(onEnable: boolean, transform: ITransformBuilder): void {
		this.addTransformFunc((enabling) => {
			if (enabling !== onEnable) {
				return Transforms.create();
			}

			return transform;
		});
	}

	isVisible(key?: ObservableSwitchKey): boolean {
		if (!key) {
			return this.visibility.get();
		}

		return this.visibility.getKeyed(key);
	}

	setVisible(visible: boolean, key?: ObservableSwitchKey): void {
		if (visible) this.show(key);
		else this.hide(key);
	}

	show(key?: ObservableSwitchKey): void {
		key ??= defaultKey;
		this.visibility.set(key, true);
	}
	hide(key?: ObservableSwitchKey): void {
		key ??= defaultKey;
		this.visibility.set(key, false);
	}

	private initializedShowOnEnable = false;
	/** Setup the control to be shown when enabled and hidden when disabled  */
	initShowOnEnable(): this {
		if (this.initializedShowOnEnable) return this;

		this.initializedShowOnEnable = true;
		this.component.onEnabledStateChange((enabled) => this.setVisible(enabled));
		return this;
	}

	destroy(): void {
		TransformService.cancel(this);
	}
}
