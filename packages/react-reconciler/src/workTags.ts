export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText

export const FunctionComponent = 0

// 挂载的根结点: hostRootFiber
export const HostRoot = 3

// <div>
export const HostComponent = 5

// <div>123</div> 中的 123
export const HostText = 6
