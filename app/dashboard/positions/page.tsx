import React from 'react';
import { PositionCard } from '@/components/position-card';
import { Position } from '@/types/position';
async function getPositions() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/positions`);
    if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

export default async function PositionsPage() {
    const data = await getPositions();
    const positions = data.positions;

    if (!positions || positions.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Positions</h1>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-500">No positions found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Positions</h1>
            <div className="grid gap-6">
                {positions.map((position: Position, index: number) => (
                    <PositionCard key={index} position={position} />
                ))}
            </div>
        </div>
    );
} 