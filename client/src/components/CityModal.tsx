import React, { useState } from 'react';
import { useCity } from '../context/CityContext';
import { X, Search, MapPin, Check } from 'lucide-react';

export const CityModal: React.FC = () => {
  const { cities, selectedCity, setSelectedCity, isCityModalOpen, setCityModalOpen } = useCity();
  const [search, setSearch] = useState('');

  if (!isCityModalOpen) return null;

  const filteredCities = cities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 rounded-2xl glass-dropdown shadow-2xl border border-white/10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-xl font-bold text-white tracking-wide">Select Your City</h2>
          </div>
          <button
            onClick={() => setCityModalOpen(false)}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative my-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for your city (e.g. Mumbai, Delhi-NCR, Bengaluru)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#E50914] transition-colors"
            autoFocus
          />
        </div>

        {/* Popular Cities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
          {filteredCities.map((city) => {
            const isSelected = selectedCity?.id === city.id;
            return (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-[#E50914]/20 border border-[#E50914] text-white shadow-glow'
                    : 'bg-[#151922] hover:bg-[#1E2330] border border-white/5 text-gray-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{city.name}</div>
                  <div className="text-xs text-gray-400">{city.state}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#E50914]" />}
              </button>
            );
          })}
        </div>

        {filteredCities.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-sm">
            No cities found matching "{search}".
          </div>
        )}
      </div>
    </div>
  );
};
