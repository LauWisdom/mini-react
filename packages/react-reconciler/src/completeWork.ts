import {
	Container,
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'hostConfig'
import { FiberNode } from './fiber'
import { HostComponent, HostRoot, HostText } from './workTags'
import { NoFlags } from './fiberFlags'

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps
	const current = wip.alternate

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// mount
				// 构建 wip fiberNode 的 dom 节点
				const instance = createInstance(wip.type, newProps)
				// 将离 wip fiberNode 最近的第一层所有 dom 子节点挂载到 wip fiberNode 的 dom 节点下
				appendAllChildren(instance, wip)
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// mount
				// 构建 wip fiberNode 的 dom 节点
				// HostText 类型的 fiberNode 不存在 child，所以不需要执行 appendAllChildren 方法
				const instance = createTextInstance(newProps.content)
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null
		case HostRoot:
			bubbleProperties(wip)
			return null
		default:
			if (__DEV__) {
				console.warn('未处理的 completeWork 情况', wip)
			}
			break
	}
}

function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode)
		} else if (node.child !== null) {
			node.child.return = node
			node = node.child
			continue
		}

		if (node === wip) {
			return
		}

		// 如果没有兄弟节点，就一直往上找父节点
		while (node?.sibling === null) {
			if (node?.return === null || node.return === wip) {
				return
			}
			node = node.return
		}
		node.sibling.return = node.return
		node = node.sibling
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags
	let child = wip.child

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags
		subtreeFlags |= child.flags

		child.return = wip
		child = child.sibling
	}

	wip.subtreeFlags |= subtreeFlags
}
