import React from "react";

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-blue-100 text-sm font-medium mb-2">
            Live Matches
          </h3>
          <p className="text-white text-3xl font-bold">0</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-green-100 text-sm font-medium mb-2">
            Tournaments
          </h3>
          <p className="text-white text-3xl font-bold">0</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-purple-100 text-sm font-medium mb-2">Teams</h3>
          <p className="text-white text-3xl font-bold">0</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-orange-100 text-sm font-medium mb-2">Players</h3>
          <p className="text-white text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            Create Tournament
          </button>
          <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition">
            Add Match
          </button>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Update Score
          </button>
        </div>
      </div>
    </div>
  );
};
