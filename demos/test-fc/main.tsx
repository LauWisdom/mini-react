import { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
	const [num, setNum] = useState(100)
	window.setNum = setNum
	return num === 1 ? <div key="1">haha</div> : <div key="1">{num}</div>
}

function Child() {
	return <span>mini-react</span>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
