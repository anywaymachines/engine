import { Component } from "engine/shared/component/Component";
import { Element } from "engine/shared/Element";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

export class AnimationWrapperComponent extends Component {
	readonly wrapper: GuiObject;

	constructor(parent: InstanceComponent<GuiObject>) {
		super();

		const instance = parent.instance;

		const wrapper = Element.create("Frame", {
			Name: "Wrapper",
			BackgroundTransparency: 1,
			Size: instance.Size,
			AnchorPoint: instance.AnchorPoint,
			AutomaticSize: instance.AutomaticSize,
			Visible: false,
		});
		wrapper.Parent = instance.Parent;
		this.wrapper = wrapper;

		this.onEnable(() => {
			wrapper.Visible = true;

			instance.AnchorPoint = new Vector2(0.5, 0.5);
			instance.Position = new UDim2(0.5, 0, 0.5, 0);
			instance.Parent = wrapper;
		});
		this.onDisable(() => {
			wrapper.Visible = false;

			instance.AnchorPoint = wrapper.AnchorPoint;
			instance.Position = wrapper.Position;
			instance.Parent = wrapper.Parent;
		});
		this.onDestroy(() => wrapper.Destroy());
	}
}
