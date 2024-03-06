import { FiberNode } from './fiber'
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher'
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue'
import { Action } from 'shared/ReactTypes'
import internals from 'shared/internals'
import { scheduleUpdateOnFiber } from './workLoop'

let currentlyRenderingFiber: FiberNode | null = null

/*
 * 在 FunctionComponent beginWork 阶段需要遍历保存在对应 FiberNode 的 memoizeState 中的 Hook 链表
 * 因此需要保存一下当前正在进行的 Hook。
 */
let workIInProgressHook: Hook | null = null

const { currentDispatcher } = internals

interface Hook {
	memoizedState: any
	updateQueue: unknown
	next: Hook | null
}

/*
 * function App() {
 *   return <div />
 * }
 * FunctionComponent 实际上是一个函数，执行后返回组件。
 * 这个函数实际上会挂载到 FunctionComponent 类型 FiberNode 的 type 属性上。
 */
export function renderWithHooks(wip: FiberNode) {
	currentlyRenderingFiber = wip
	wip.memoizedState = null

	const current = wip.alternate
	if (current !== null) {
		// update
	} else {
		currentDispatcher.current = HooksDispatcherOnMount
	}

	const Component = wip.type
	const props = wip.pendingProps
	const children = Component(props)

	currentlyRenderingFiber = null
	return children
}

// mount 时的 hook 集合
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
}

// update 时的 hook 集合
// const HooksDispatcherOnUpdate: Dispatcher = {}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	const hook = mountWorkInProgressHook()

	let memoizedState
	if (initialState instanceof Function) {
		memoizedState = initialState()
	} else {
		memoizedState = initialState
	}

	const queue = createUpdateQueue<State>()
	hook.updateQueue = queue
	hook.memoizedState = memoizedState

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)
	queue.dispatch = dispatch
	return [memoizedState, dispatch]
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action)
	enqueueUpdate(updateQueue, update)
	scheduleUpdateOnFiber(fiber)
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	}

	// workIInProgressHook === null 说明是 mount 时的第一个 hook
	if (workIInProgressHook === null) {
		// 说明没有在 Function Component 中执行 useState
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 hook')
		} else {
			workIInProgressHook = hook
			currentlyRenderingFiber.memoizedState = workIInProgressHook
		}
	} else {
		// mount 时后续的 hook
		workIInProgressHook.next = hook
		workIInProgressHook = hook
	}
	return workIInProgressHook
}
