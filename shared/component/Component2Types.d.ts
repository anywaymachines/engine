declare namespace BaseComponentTypes {
	export interface ComponentBase extends DebuggableComponent {
		readonly enabledState: ComponentEState;
	}
}

interface DebuggableComponent {
	getDebugChildren(): readonly DebuggableComponent[];
}
interface Component2PropMacros extends BaseComponentTypes.ComponentBase {}
