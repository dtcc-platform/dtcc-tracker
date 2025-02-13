'use client'

import React, { useEffect, useState } from "react";
import Image from "next/image";
import dtcc_logo from '../../public/dtcc-logo.png';
import chalmers_logo from '../../public/chalmers-logo.png'
import Link from "next/link";
import Sidebar from "./sidebar";
import { Paper, Project } from "@/app/types/FixedTypes";
import { fetchProjects } from "@/app/utils/api";
import { useRefresh } from "../app/hooks/RefreshContext";


const Header: React.FC = () => {
  const HEADER_HEIGHT = 64; // Height of the header in pixels
  // const [newPapers, setNewPapers] = useState<Paper[]>([]);
  const {papers, projects} = useRefresh()
  const { refreshKey } = useRefresh();

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const papersData = await fetchPapers();
  //       setNewPapers(papersData);
  //     } catch (error) {
  //       console.error('Error fetching papers:', error);
  //     }
  //   };
  //   console.log(refreshKey)
  //   fetchData();
  // }, [refreshKey]);
  // console.log(newPapers)
  return (
    <div>
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
            src={dtcc_logo}
            alt="DTCC Logo"
            className="max-w-[80px] h-auto object-contain"
          />
        </div>

        {/* Right side: Chalmers logo and Log out button */}
        <div className="flex items-center ml-auto space-x-4">
          <Image
            src={chalmers_logo}
            alt="Chalmers Logo"
            className="max-w-[80px] h-auto object-contain"
          />
          <Link href="/login">
            <button className="px-2 py-1 font-semibold text-gray-700 bg-white border border-gray-500 rounded-md cursor-pointer hover:bg-gray-100">
              Log out
            </button>
          </Link>
        </div>
      </div>

        </div>
      </div>
  );
};

export default Header;
