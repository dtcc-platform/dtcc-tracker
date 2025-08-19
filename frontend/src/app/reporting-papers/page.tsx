'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRefresh } from "../contexts/RefreshContext";
import { fetchSuperUserPaper, updateYear } from "../utils/api";

export default function ReportingPage() {
    const { isAuthenticated, isSuperUser } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState("all");
    const { superUserPapers, triggerRefresh } = useRefresh();

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

    const handleYearChange = async (paperId: number, selectedYear: number) => {
        try {
            await updateYear(paperId, selectedYear);
            triggerRefresh();
            console.log(`Year updated for paper ${paperId} to ${selectedYear}`);
        } catch (error) {
            console.error("Error updating year:", error);
        }
    };

    const getFilteredPapers = () => {
        if (!superUserPapers || superUserPapers.length === 0) {
            return [];
        }

        if (filter === "all") {
            return superUserPapers;
        }

        if (filter === "not-submitted") {
            return superUserPapers.filter(paper => 
                !paper.submissionYear || 
                paper.submissionYear === null || 
                paper.submissionYear === undefined
            );
        }
        const filterYear = parseInt(filter);
        if (!isNaN(filterYear)) {
            return superUserPapers.filter(paper => 
                paper.submissionYear === filterYear
            );
        }

        return superUserPapers;
    };

    const filteredPapers = getFilteredPapers();

    if (!isAuthenticated || !isSuperUser) {
        return null;
    }

    console.log("TESTING", superUserPapers)
    
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
                {filteredPapers && filteredPapers.length > 0 ? (
                    filteredPapers.map((paper, index) => (
                        <div
                            key={paper.doi || index}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 space-y-2">
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

                                <div className="ml-4 flex-shrink-0">
                                    <select
                                        value={paper.submissionYear?.toString() ?? ""}
                                        onChange={(e) => handleYearChange(paper.id!, parseInt(e.target.value))}
                                        className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="" disabled>
                                            Select Year
                                        </option>
                                        {generateYearOptions().map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
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