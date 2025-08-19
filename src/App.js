// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./pages/Home";
import UserDashboard from "./components/user/UserDashboard";
import BookBike from "./components/user/BookBike";
import ReturnBike from "./components/user/ReturnBike";
import Login from "./components/auth/Login";
import NotFound from "./pages/NotFound";
import Signup from "./components/auth/Signup";
import Profile from "./components/auth/Profile";

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/book" element={<BookBike />} />
        <Route path="/return" element={<ReturnBike />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
