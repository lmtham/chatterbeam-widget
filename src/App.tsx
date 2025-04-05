
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from "sonner";

import Index from './pages/Index'
import TTSTest from './pages/tts-test'
import AvatarAssistant from './pages/AvatarAssistant'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/tts-test" element={<TTSTest />} />
        <Route path="/avatar" element={<AvatarAssistant />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" />
    </Router>
  )
}

export default App
