import { Component } from "engine/shared/component/Component";

declare global {
	interface IHostedService extends Component {}
}

export class HostedService extends Component {
	//
}
