'use client'
import React, { useEffect, useState } from "react";
import Image from "next/image";
import chalmers_logo from '../../public/chalmers-logo.png'
import Link from "next/link";
import Sidebar from "./sidebar";
import newLogo from '../../public/dtcc-logo-new.png'
import { useRefresh } from "../app/hooks/RefreshContext";
import { useAuth } from "@/app/hooks/AuthContext";

const Header: React.FC = () => {
  const HEADER_HEIGHT = 64; // Height of the header in pixels
  // const [newPapers, setNewPapers] = useState<Paper[]>([]);
  const {papers, projects} = useRefresh();
  const {logout, isAuthenticated} = useAuth();
  return (
    isAuthenticated &&<div>
    <Sidebar papers={papers} projects={projects}></Sidebar>
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '250px',
        right: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
        height: `${HEADER_HEIGHT}px`,
      }}>
      <div className="flex items-center px-4 py-3">
        {/* Left side: dtcc logo only */}
        <div className="flex items-center">
          <Image
            src={newLogo}
            alt="DTCC Logo"
            className="object-contain max-w-[40px]" />
          {/* Vertical divider with a specific color */}
          <div className="h-10 w-px bg-[#899BAF] mx-4"></div>
          {/* Text in two lines */}
         <div className="flex flex-col text-[#899BAF] leading-tight">
            <span className="font-bold">Digital Twin</span>
            <span className="font-bold">Cities Centre</span>
          </div>
        </div>

        {/* Right side: Chalmers logo and Log out button */}
        <div className="flex items-center ml-auto space-x-4">
          <Image
            src={chalmers_logo}
            alt="Chalmers Logo"
            className="max-w-[80px] h-auto object-contain"
          />
            <button 
              onClick={logout}
              className="px-2 py-1 font-semibold text-gray-700 bg-white border border-gray-500 rounded-md cursor-pointer hover:bg-gray-100"
              >
              Log out
            </button>
        </div>
      </div>

        </div>
      </div>
  );
};

export default Header;
