import './App.css'
import React, { Component } from "react";

const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));
const App = () => {
    return (
    <DefaultLayout/>
  )
}

export default App
