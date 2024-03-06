import { Dispatcher, resolveDispatcher } from './src/currentDispatcher'
import currentDispatcher from './src/currentDispatcher'
import { jsx } from './src/jsx'

// 业务项目中用这个
export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher()
	return dispatcher.useState(initialState)
}

// react 内部用这个作为数据共享
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FILE = {
	currentDispatcher
}

export default {
	version: '0.0.0',
	createElement: jsx
}
