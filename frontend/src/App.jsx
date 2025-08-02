import { useState } from 'react';
import {BrowserRouter as Router,Routes,Route} from "react-router-dom"
import AuthPage from './components/AuthPage';
import PaymentPage from './components/PaymentPage';

export default function App() {

  return(
    <Router>
      <Routes>
        <Route element={<AuthPage/>} path='/'/>
        <Route element={<PaymentPage/>} path='/payment'/>
      </Routes>
    </Router>
  )

}
