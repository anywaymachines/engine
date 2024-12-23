import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import type { ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { TransformBuilder } from "engine/shared/component/Transform";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

export class VisibilityComponent implements ComponentTypes.DestroyableComponent {
	private readonly transforming: InstanceValueTransformContainer<boolean>;
	readonly visible;
	readonly instance: GuiObject;

	constructor(readonly component: InstanceComponent<GuiObject>) {
		this.instance = component.instance;
		this.visible = component.valuesComponent().get("Visible");
		this.visible.setDefaultComputingValue(true);

		this.transforming = this.visible.transforms;
		this.transforming.addTransform((value) => {
			if (!value) return Transforms.create();
			return Transforms.create().show(this.instance);
		});
	}

	subscribeFrom(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }): void {
		this.visible.subscribeFrom(values);
	}

	waitForTransform(): TransformBuilder {
		return Transforms.create().waitForTransformOf(this.transforming);
	}
	waitForTransformThenDestroy() {
		this.waitForTransform()
			.then()
			.func(() => this.component.destroy())
			.run(this);
	}

	addTransformFunc(func: (enabling: boolean) => TransformBuilder): void {
		this.transforming.addTransform(func);
	}
	addTransform(onEnable: boolean, transform: () => TransformBuilder): void {
		this.addTransformFunc((enabling) => {
			if (enabling !== onEnable) {
				return Transforms.create();
			}

			return transform();
		});
	}

	isVisible(): boolean {
		return this.visible.value.get();
	}

	setVisible(visible: boolean, key?: ValueOverlayKey): void {
		if (visible) this.show(key);
		else this.hide(key);
	}

	show(key?: ValueOverlayKey): void {
		this.visible.and(key, true);
	}
	hide(key?: ValueOverlayKey): void {
		this.visible.and(key, false);
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
