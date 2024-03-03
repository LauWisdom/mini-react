import { FiberNode } from './fiber'

/*
 * FunctionComponent 示例：
 * function App() {
 *   return <div />
 * }
 *
 * FunctionComponent 实际上是一个函数，执行后返回组件
 * 这个函数实际上会挂载到 FunctionComponent 类型 FiberNode 的 type 属性上
 */
export function renderWithHooks(wip: FiberNode) {
	const Component = wip.type
	const props = wip.pendingProps
	const children = Component(props)
	return children
}
