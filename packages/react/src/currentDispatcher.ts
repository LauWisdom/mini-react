/*
 * 保存当前使用的 hooks 集合
 */

import { Action } from 'shared/ReactTypes'

export interface Dispatcher {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>]
}

export type Dispatch<State> = (action: Action<State>) => void

const currentDispatcher: {
	current: Dispatcher | null
} = {
	current: null
}

export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current

	if (dispatcher === null) {
		throw new Error('hook 只能在 Function Component 中执行')
	}
	return dispatcher
}

export default currentDispatcher
