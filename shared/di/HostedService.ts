import { Component } from "engine/shared/component/Component";

export class HostedService extends Component {
	disable(): void {
		throw "Can not disable a HostedService";
	}
}
