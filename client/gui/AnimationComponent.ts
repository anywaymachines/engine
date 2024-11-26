import { InstanceComponent } from "engine/shared/component/InstanceComponent";

export class AnimationComponent<T extends Instance> extends InstanceComponent<T> {
	constructor(instance: T) {
		super(instance);
	}
}
