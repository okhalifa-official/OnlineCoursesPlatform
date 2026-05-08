import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NavBar() {



    return (
        <nav className="bg-[#F2F2F2] px-6 py-4 flex items-center justify-between shadow-sm">
      {/* Logo / Title */}
      <div className="flex items-center gap-3">
        <img src="../../public/logo.png" alt="Sono School Logo" className="h-12 w-auto" />
        <div className="text-xl font-bold text-center leading-none">
            <span className="text-[#D62828]">Sono</span>
            <span className="text-[#1A1A1A]">School</span>
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center gap-6 text-[#1A1A1A] font-medium">
        <a href="#" className="hover:text-gray-600">Gallery</a>
        <a href="#" className="hover:text-gray-600">Verify</a>
        <a href="#" className="hover:text-gray-600">Education Center</a>
        <a href="#" className="hover:text-gray-600">Events</a>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <button className="bg-[#D62828] text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors">
          Login
        </button>
      </div>
    </nav>
    );
}