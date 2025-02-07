import { Colors } from "engine/shared/Colors";
import { Component } from "engine/shared/component/Component";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { TransformProps } from "engine/shared/component/Transform";

type RGBA = { readonly color: Color3; readonly transparency: number };
export class ButtonBackgroundColorComponent extends Component {
	readonly mouseEnterColor = new ObservableValue<RGBA>({ color: Colors.black, transparency: 0.3 });
	readonly mouseHoldingColor = new ObservableValue<RGBA>({ color: Colors.white, transparency: 0.2 });

	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super();

		parent.instance.AutoButtonColor = false;
		const props: TransformProps = { ...Transforms.quadOut02, duration: 0.1 };

		const bg = parent.valuesComponent().get("BackgroundColor3");

		const bgColor = new ObservableValue(new Color3(0, 0, 0));
		const bgAlpha = new ObservableValue(0);
		const upd = () => bg.effect("button_highlight", (color) => color.Lerp(bgColor.get(), bgAlpha.get()), 999999);

		this.event.subscribeObservable(this.mouseEnterColor, upd);
		this.event.subscribeObservable(this.mouseHoldingColor, upd);

		this.event.subscribeObservable(bgColor, upd);
		this.event.subscribeObservable(bgAlpha, upd);
		this.onEnable(upd);

		this.event.subscribe(parent.instance.MouseEnter, () => {
			Transforms.create() //
				.transformObservable(bgColor, this.mouseEnterColor.get().color, props)
				.transformObservable(bgAlpha, this.mouseEnterColor.get().transparency, props)
				.run(this, true);
		});
		this.event.subscribe(parent.instance.MouseButton1Up, () => {
			Transforms.create() //
				.transformObservable(bgColor, this.mouseEnterColor.get().color, props)
				.transformObservable(bgAlpha, this.mouseEnterColor.get().transparency, props)
				.run(this, true);
		});

		this.event.subscribe(parent.instance.MouseButton1Down, () => {
			Transforms.create() //
				.transformObservable(bgColor, this.mouseHoldingColor.get().color, props)
				.transformObservable(bgAlpha, this.mouseHoldingColor.get().transparency, props)
				.run(this, true);
		});

		const stop = () => {
			Transforms.create() //
				.transformObservable(bgAlpha, 0, props)
				.then()
				.transformObservable(bgColor, new Color3(0, 0, 0), props)
				.run(this, true);
		};
		this.event.subscribe(parent.instance.MouseLeave, stop);
		this.onDisable(stop);
	}
}
