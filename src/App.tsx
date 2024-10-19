import './App.css'
import React, { Component } from "react";

const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));
class App extends Component {

  render() {
    return <DefaultLayout/>;
  }
}

export default App
