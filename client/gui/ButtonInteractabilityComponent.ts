import { Component } from "engine/shared/component/Component";
import { Transforms } from "engine/shared/component/Transforms";
import type { ButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** Component that handles button interactability. */
export class ButtonInteractabilityComponent extends Component {
	private readonly parentComponent;
	private readonly transparencyOverlay;

	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super();

		this.parentComponent = parent;

		this.transparencyOverlay = parent.valuesComponent().get("Transparency");
		this.transparencyOverlay.transforms.addTransform((transparency) =>
			Transforms.create()
				.if(parent.instance.Transparency === 1 && transparency !== 1, (tr) => tr.show(parent.instance))
				.transform(parent.instance, "Transparency", transparency, Transforms.quadOut02)
				.if(transparency === 1, (tr) => tr.then().hide(parent.instance)),
		);
	}

	setInteractable(interactable: boolean): void {
		this.parentComponent.instance.Interactable = interactable;
		this.transparencyOverlay.overlay(5, interactable ? undefined : 0.6);
	}
}
