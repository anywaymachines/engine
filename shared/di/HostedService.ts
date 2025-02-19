import { Component } from "engine/shared/component/Component";
import { getDIClassSymbol } from "engine/shared/di/DIPathFunctions";

export class HostedService extends Component {
	override disable(): void {
		$warn("Can't disable a HostedService ", getDIClassSymbol(this));
	}
}
