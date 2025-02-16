import { Component } from "engine/shared/component/Component";

export class HostedService extends Component {
	override disable(): void {
		$warn("Can't disable a HostedService");
	}
}
