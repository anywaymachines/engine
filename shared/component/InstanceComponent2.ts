import { Component2 } from "engine/shared/component/Component2";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import type { ComponentConfig } from "engine/shared/component/Component2";

export interface InstanceComponentConfig extends ComponentConfig {
	readonly destroyComponentOnInstanceDestroy?: boolean;
	readonly destroyInstanceOnComponentDestroy?: boolean;
}

export interface InstanceComponent2<T extends Instance> {
	//
}
export class InstanceComponent2<T extends Instance> extends Component2 {
	constructor(
		readonly instance: T,
		config?: InstanceComponentConfig,
	) {
		super(config);

		ComponentInstance.init(
			this,
			instance,
			config?.destroyComponentOnInstanceDestroy,
			config?.destroyInstanceOnComponentDestroy,
		);
	}
}
