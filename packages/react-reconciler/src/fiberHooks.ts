import { FiberNode } from './fiber'
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher'
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
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

let currentHook: Hook | null = null

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
		currentDispatcher.current = HooksDispatcherOnUpdate
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount
	}

	const Component = wip.type
	const props = wip.pendingProps
	const children = Component(props)

	currentlyRenderingFiber = null
	workIInProgressHook = null
	currentHook = null
	return children
}

// mount 时的 hook 集合
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
}

// update 时的 hook 集合
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
}

function updateState<State>(): [State, Dispatch<State>] {
	const hook = updateWorkInProgressHook()

	// 计算新 state 逻辑
	const queue = hook.updateQueue as UpdateQueue<State>
	const pending = queue.shared.pending

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending)
		hook.memoizedState = memoizedState
	}
	return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

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

function updateWorkInProgressHook(): Hook {
	// TODO: render 阶段更新

	// 交互阶段触发更新
	let nextCurrentHook: Hook | null
	// 说明该 Function Component update 时的第一个 hook
	if (currentHook === null) {
		const current = currentlyRenderingFiber?.alternate
		if (current !== null) {
			nextCurrentHook = current?.memoizedState
		} else {
			// 说明是 mount 阶段，但本方法是 update 阶段才会执行，所以如果进入到这里，说明有问题
			nextCurrentHook = null
		}
	} else {
		nextCurrentHook = currentHook.next
	}

	/*
	 * 上次 mount/update：hook1 -> hook2 -> hook3
	 * 本次 update: hook1 -> hook2 -> hook3 -> hook4
	 *
	 * 伪代码：
	 * function FC() {
	 *	 hook1()
	 *	 hook2()
	 *	 hook3()
	 *	 if (满足条件) {
	 *		 hook4()
	 *   }
	 * }
	 */
	if (nextCurrentHook === null) {
		throw new Error(
			`组件 ${currentlyRenderingFiber?.type} 本次执行时的 Hook 多于上次执行时`
		)
	}

	currentHook = nextCurrentHook as Hook
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	}

	if (workIInProgressHook === null) {
		// 说明没有在 Function Component 中执行 useState
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 hook')
		} else {
			workIInProgressHook = newHook
			currentlyRenderingFiber.memoizedState = workIInProgressHook
		}
	} else {
		// mount 时后续的 hook
		workIInProgressHook.next = newHook
		workIInProgressHook = newHook
	}

	return workIInProgressHook
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
