import { beginWork } from './beginWork'
import { commitMutationEffects } from './commitWork'
import { completeWork } from './completeWork'
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber'
import { MutationMask, NoFlags } from './fiberFlags'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null

function prepareRefreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {})
}
/*
 * 传进来的 fiber 有以下情况：
 * 1. 首屏渲染: hostRootFiber
 * 2. this.setState(): Class Component 对应的 fiber
 */
export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// TODO: 调度功能，未来实现
	const root = markUpdateFromFiberToRoot(fiber)
	renderRoot(root)
}

// 从当前 fiberNode 向上寻找到 fiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber
	let parent = node.return
	while (parent !== null) {
		node = parent
		parent = node.return
		node.alternate
	}
	if (node.tag === HostRoot) {
		return node.stateNode
	}
	return null
}

function renderRoot(root: FiberRootNode) {
	// 这里会生成 wip FiberNode 并把它赋值给全局变量 workInProgress
	// 同时将 root.current.alternate 指向生成的 wip FiberNode
	prepareRefreshStack(root)

	do {
		try {
			workLoop()
			break
		} catch (error) {
			if (__DEV__) {
				console.warn('workLoop发生错误', error)
			}
			workInProgress = null
		}
	} while (true)

	// root.current.alternate 在上面执行 prepareRefreshStack 方法时就已经有指向了
	const finishedWork = root.current.alternate
	root.finishedWork = finishedWork
	commitRoot(root)
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork
	if (finishedWork === null) {
		return
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork)
	}

	root.finishedWork = null

	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

	if (subtreeHasEffect || rootHasEffect) {
		commitMutationEffects(finishedWork)
		root.current = finishedWork
	} else {
		root.current = finishedWork
	}
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress)
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber)
	fiber.memoizedProps = fiber.pendingProps

	if (next === null) {
		completeUnitOfWork(fiber)
	} else {
		workInProgress = next
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber

	do {
		completeWork(node)
		const sibling = node?.sibling

		if (sibling !== null) {
			workInProgress = sibling
			return
		}
		node = node?.return
		workInProgress = node
	} while (node !== null)
}
