
import { useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import TTSTest from './pages/tts-test';
import AvatarAssistant from './pages/AvatarAssistant';
import InteractiveAvatar from './pages/InteractiveAvatar';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Index />,
      errorElement: <NotFound />,
    },
    {
      path: '/tts-test',
      element: <TTSTest />,
    },
    {
      path: '/avatar-assistant',
      element: <AvatarAssistant />,
    },
    {
      path: '/interactive-avatar',
      element: <InteractiveAvatar />,
    }
  ]);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
