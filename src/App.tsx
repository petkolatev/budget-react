import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import { Budget } from './features/budget/Budget';
import { AnnualBudget } from './features/budget/AnnualBudget';
import { CategoriesPage } from './features/budget/Categories';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <nav className="topNav">
          <div className="navTitle">Budget App</div>
          <div className="navLinks">
            <NavLink to="/" end className={({isActive}) => 'navLink' + (isActive ? ' navLinkActive' : '')}>
              Движения (Budget)
            </NavLink>
            <NavLink to="/annual" className={({isActive}) => 'navLink' + (isActive ? ' navLinkActive' : '')}>
              Годишен Бюджет
            </NavLink>
            <NavLink to="/categories" className={({isActive}) => 'navLink' + (isActive ? ' navLinkActive' : '')}>
              Категории
            </NavLink>
          </div>
        </nav>

        <main className="pageContent">
          <Routes>
            <Route path="/" element={<Budget />} />
            <Route path="/annual" element={<AnnualBudget />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Routes>
        </main>
      </header>
    </div>
  );
}

export default App;
