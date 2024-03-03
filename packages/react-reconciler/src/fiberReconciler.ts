import { Container } from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import { HostRoot } from './workTags'
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue'
import { ReactElementType } from 'shared/ReactTypes'
import { scheduleUpdateOnFiber } from './workLoop'

/*
 * ReactDom.createRoot(rootElement).render(<App />);
 * createRoot(rootElement) 中会调用该方法
 */
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null)
	const root = new FiberRootNode(container, hostRootFiber)
	hostRootFiber.updateQueue = createUpdateQueue()
	return root
}

/*
 * ReactDom.createRoot(rootElement).render(<App />);
 * render(<App />) 中会调用该方法
 */
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current
	// 从下面几行代码可以知道
	// hostRootFiber 的 updateQueue 中存的 update 实际上是 <App /> 的 ReactElement
	const update = createUpdate<ReactElementType | null>(element)
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	)
	scheduleUpdateOnFiber(hostRootFiber)
	return element
}
