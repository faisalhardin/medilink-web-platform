import { Modal } from '@components/Modal';
import DomainRedirect from '@components/DomainRedirect';
import './App.css'
import React from "react";
import { ModalProvider } from 'context/ModalContext';

const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));
const App = () => {
  return (
      <ModalProvider>
        <DomainRedirect enableRedirect={true}>
          <DefaultLayout />
        </DomainRedirect>
        <Modal />
      </ModalProvider>
  )
}

export default App