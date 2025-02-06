import React from 'react';
import { PositionsTable } from '@/components/positions-table';

// Make the page dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PositionsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Positions</h1>
            <PositionsTable />
        </div>
    );
} 