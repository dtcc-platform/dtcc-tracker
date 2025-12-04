'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { fetchPaperMilestoneStats, MilestoneStats } from "../utils/api";
import { palette, gradients, shadows } from "../theme";

export default function PaperStatisticsPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<MilestoneStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const loadStats = async () => {
            setLoading(true);
            const data = await fetchPaperMilestoneStats();
            setStats(data);
            setLoading(false);
        };

        loadStats();
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null;
    }

    const cardStyle: React.CSSProperties = {
        background: gradients.card,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: shadows.card,
        border: `1px solid ${palette.borderSoft}`,
    };

    const totalCardStyle: React.CSSProperties = {
        ...cardStyle,
        background: gradients.button,
        color: palette.textDark,
        textAlign: 'center',
    };

    const milestoneCardStyle: React.CSSProperties = {
        ...cardStyle,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const countBadgeStyle: React.CSSProperties = {
        background: gradients.button,
        color: palette.textDark,
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '18px',
        minWidth: '50px',
        textAlign: 'center',
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6" style={{ color: palette.textDark }}>
                    Paper Statistics
                </h1>
                <div className="text-center py-8" style={{ color: palette.textMuted }}>
                    Loading statistics...
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6" style={{ color: palette.textDark }}>
                Paper Statistics
            </h1>

            {/* Total Papers Card */}
            <div className="mb-8">
                <div style={totalCardStyle}>
                    <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
                        {stats?.totalPapers ?? 0}
                    </div>
                    <div style={{ fontSize: '18px', marginTop: '8px' }}>
                        Total Papers Registered
                    </div>
                </div>
            </div>

            {/* Milestone Breakdown */}
            <h2 className="text-xl font-semibold mb-4" style={{ color: palette.textDark }}>
                Papers by Milestone Project
            </h2>

            <div className="space-y-3">
                {stats?.byMilestone && stats.byMilestone.length > 0 ? (
                    stats.byMilestone.map((item, index) => (
                        <div key={index} style={milestoneCardStyle}>
                            <span style={{
                                fontSize: '16px',
                                color: palette.textDark,
                                fontWeight: '500'
                            }}>
                                {item.milestoneProject}
                            </span>
                            <span style={countBadgeStyle}>
                                {item.count}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8" style={{ color: palette.textMuted }}>
                        No papers registered yet.
                    </div>
                )}
            </div>
        </div>
    );
}
