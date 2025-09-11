import { Modal } from '@components/Modal';
import './App.css'
import React from "react";
import { ModalProvider } from 'context/ModalContext';

const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));
const App = () => {
  return (
      <ModalProvider>
        <DefaultLayout />
        <Modal />
      </ModalProvider>
  )
}

export default App
