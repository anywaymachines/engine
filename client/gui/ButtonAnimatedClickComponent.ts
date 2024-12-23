import { AnimationWrapperComponent } from "engine/client/gui/AnimationWrapperComponent";
import { Component } from "engine/shared/component/Component";
import { Transforms } from "engine/shared/component/Transforms";
import { Element } from "engine/shared/Element";
import type { ButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

export class ButtonAnimatedClickComponent extends Component {
	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super();

		parent.getComponent(AnimationWrapperComponent);
		const uiscale = Element.create("UIScale", { Parent: parent.instance, Scale: 1 });
		this.onDestroy(() => uiscale.Destroy());

		const scale = this.event.observableFromInstanceParam(uiscale, "Scale");

		this.event.subscribe(parent.instance.MouseButton1Down, () => {
			Transforms.create() //
				.wait(0.1)
				.then()
				.transformObservable(scale, 0.8, { duration: 1 })
				.run(scale, true);
		});

		const stop = () => {
			Transforms.create() //
				.transformObservable(scale, 1, { style: "Bounce", duration: 0.4 })
				.run(scale, true);
		};
		this.event.subscribe(parent.instance.MouseButton1Up, stop);
		this.event.subscribe(parent.instance.MouseLeave, stop);
		this.onDisable(stop);
	}
}
