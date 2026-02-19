import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import LoginSign from './login_sign/login_sign'
import AdminHome from './login_sign/admin_home_temp'
import UserHome from './login_sign/user_home_temp'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginSign />} />
        <Route path="/admin_home_temp" element={<AdminHome />} />
        <Route path="/user_home_temp" element={<UserHome />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
