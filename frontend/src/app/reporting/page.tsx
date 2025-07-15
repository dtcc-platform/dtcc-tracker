'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/AuthContext";
import { useRouter } from "next/navigation";
import { useRefresh } from "../hooks/RefreshContext";
import { fetchSuperUserPaper } from "../utils/api";
export default function ReportingPage() {
    const { isAuthenticated, isSuperUser } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState("all");
    const {superUserPapers} = useRefresh();
    useEffect(() => {
        const papers = fetchSuperUserPaper();
        if (!isAuthenticated) {
            return;
        }
        if (!isSuperUser) {
            router.push("/");
            return;
        }
    }, [isAuthenticated, isSuperUser, router]);



    const generateYearOptions = () => {
        const years = [];
        for (let year = 2020; year <= 2029; year++) {
            years.push(year);
        }
        return years;
    };

    if (!isAuthenticated || !isSuperUser) {
        return null;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
                
                <div className="relative">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Papers</option>
                        <option value="not-submitted">Not Submitted</option>
                        {generateYearOptions().map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {superUserPapers && superUserPapers.length > 0 ? (
                    superUserPapers.map((paper, index) => (
                        <div
                            key={paper.doi || index}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {paper.title || "Untitled"}
                                </h3>
                                <div className="flex flex-col space-y-1 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">DOI:</span> {paper.doi || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Type:</span> {paper.publicationType || "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No papers found for the selected filter.
                    </div>
                )}
            </div>
        </div>
    );
}