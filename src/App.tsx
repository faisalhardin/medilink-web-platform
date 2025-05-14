import { Modal } from '@components/Modal';
import './App.css'
import React, { Component } from "react";
import { ModalProvider } from 'context/ModalContext';
import { BrowserRouter as Router } from 'react-router-dom';

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
