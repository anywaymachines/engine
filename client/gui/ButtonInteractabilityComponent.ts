import { Component } from "engine/shared/component/Component";
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
	}

	setInteractable(interactable: boolean): void {
		this.parentComponent.instance.Interactable = interactable;
		this.transparencyOverlay.overlay(5, interactable ? undefined : 0.6);
	}
}
