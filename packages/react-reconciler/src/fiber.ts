import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes'
import { FunctionComponent, HostComponent, WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'
import { Container } from 'hostConfig'

export class FiberNode {
	type: any
	tag: WorkTag
	key: Key
	stateNode: any
	return: FiberNode | null
	sibling: FiberNode | null
	child: FiberNode | null
	ref: Ref
	index: number
	pendingProps: Props
	memoizedProps: Props | null
	memoizedState: any
	updateQueue: unknown
	alternate: FiberNode | null
	flags: Flags
	subtreeFlags: Flags

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag
		this.key = key
		this.stateNode = null
		this.type = null

		this.return = null
		this.sibling = null
		this.child = null
		this.index = 0
		this.ref = null

		// 作为工作单元
		this.pendingProps = pendingProps
		this.memoizedProps = null
		/*
		 * HostRoot: 保存 root 节点下的 ReactElement
		 * FunctionComponent: 保存 hook 链表
		 */
		this.memoizedState = null
		this.updateQueue = null

		this.alternate = null

		// 副作用
		this.flags = NoFlags
		this.subtreeFlags = NoFlags
	}
}

export class FiberRootNode {
	container: Container
	current: FiberNode
	finishedWork: FiberNode | null // 本次更新生成的 FiberNodeTree(wip)

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container
		this.current = hostRootFiber
		hostRootFiber.stateNode = this
		this.finishedWork = null
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key)
		wip.stateNode = current.stateNode
		wip.alternate = current
		current.alternate = wip
	} else {
		// update
		wip.pendingProps = pendingProps
		wip.flags = NoFlags
		wip.subtreeFlags = NoFlags
	}
	wip.type = current.type
	wip.updateQueue = current.updateQueue
	wip.child = current.child
	wip.memoizedProps = current.memoizedProps
	wip.memoizedState = current.memoizedState
	return wip
}

export function createFiberFromElement(element: ReactElementType) {
	const { type, key, props } = element
	let fiberTag: WorkTag = FunctionComponent

	if (typeof type === 'string') {
		fiberTag = HostComponent
	} else {
		console.warn('未定义的 type 类型', element)
	}

	const fiber = new FiberNode(fiberTag, props, key)
	fiber.type = type
	return fiber
}
