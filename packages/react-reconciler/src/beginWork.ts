import { ReactElementType } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import { UpdateQueue, processUpdateQueue } from './updateQueue'
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags'
import { reconcileChildFibers, mountChildFibers } from './childFibers'
import { renderWithHooks } from './fiberHooks'

// 返回 wip 的子 fiberNode
export const beginWork = (wip: FiberNode) => {
	switch (wip.tag) {
		case HostRoot:
			// HostRootFiber
			return updateHostRoot(wip)
		case HostComponent:
			return updateHostComponent(wip)
		case HostText:
			// 没有 beginWork 流程，因为它没有子节点
			return null
		case FunctionComponent:
			return updateFunctionComponent(wip)
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的类型')
			}
			break
	}
	return null
}

/*
 * HostRoot 的 beginWork 流程：
 * 1. 计算状态的最新值
 * 2. 创建子 fiberNode
 */
function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState

	const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>
	const pending = updateQueue.shared.pending
	updateQueue.shared.pending = null

	// hostRootFiber 的 updateQueue 中存的 update 实际上是 <App /> 的 ReactElement
	// 所以计算出来的 memoizedState 实际上是一个 ReactElement
	const { memoizedState } = processUpdateQueue<ReactElementType>(
		baseState,
		pending
	)
	wip.memoizedState = memoizedState
	const nextChildren = wip.memoizedState
	reconcileChildren(wip, nextChildren)
	return wip.child
}

/*
 * HostComponent 的 beginWork 流程：只有创建子 fiberNode
 *
 * <div><span /></div>
 * span 的 ReactElement 存在 div 对应的 fiberNode 的 props.children 里面
 */
function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps
	const nextChildren = nextProps.children
	reconcileChildren(wip, nextChildren)
	return wip.child
}

function updateFunctionComponent(wip: FiberNode) {
	const nextChildren = renderWithHooks(wip)
	reconcileChildren(wip, nextChildren)
	return wip.child
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate
	if (current !== null) {
		wip.child = reconcileChildFibers(wip, current?.child, children)
	} else {
		wip.child = mountChildFibers(wip, null, children)
	}
}
