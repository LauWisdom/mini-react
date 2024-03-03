import { ReactElementType } from 'shared/ReactTypes'
import { FiberNode, createFiberFromElement } from './fiber'
import { REACT_ElEMENT_TYPE } from 'shared/ReactSymbols'
import { HostText } from './workTags'
import { Placement } from './fiberFlags'

// TODO: currentFiber 还没用到，是不是用来 diff 的
function ChildReconciler(shouldTrackEffects: boolean) {
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const fiber = createFiberFromElement(element)
		fiber.return = returnFiber
		return fiber
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		const fiber = new FiberNode(HostText, { content }, null)
		fiber.return = returnFiber
		return fiber
	}

	function placeSingleChild(fiber: FiberNode) {
		// fiber.alternate === null 说明该子 fiber 是首屏渲染
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement
		}
		return fiber
	}

	return function reconcileChildrenFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ElEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					)
				default:
					if (__DEV__) {
						console.warn('未实现的 reconcile 类型', newChild)
					}
					break
			}
		}

		// TODO: 多节点

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			)
		}

		if (__DEV__) {
			console.warn('未实现的 reconcile 类型', newChild)
		}
		return null
	}
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
