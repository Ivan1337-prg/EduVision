import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
        </div>

          <h1>TEACHER WEB APP</h1>
        
    </>
  )
}

export default App
