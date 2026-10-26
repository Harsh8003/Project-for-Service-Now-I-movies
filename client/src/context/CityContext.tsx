import React, { createContext, useContext, useState, useEffect } from 'react';
import { City } from '../types';
import { api } from '../services/api';

interface CityContextType {
  cities: City[];
  selectedCity: City | null;
  setSelectedCity: (city: City) => void;
  isCityModalOpen: boolean;
  setCityModalOpen: (open: boolean) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isCityModalOpen, setCityModalOpen] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.getCities();
        if (res.success && res.data.length > 0) {
          setCities(res.data);
          // Check saved preference or default to Mumbai
          const savedSlug = localStorage.getItem('cinematic_city');
          const defaultCity = res.data.find((c: City) => c.slug === savedSlug) || res.data[0];
          setSelectedCity(defaultCity);
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
      }
    };

    fetchCities();
  }, []);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    localStorage.setItem('cinematic_city', city.slug);
    setCityModalOpen(false);
  };

  return (
    <CityContext.Provider
      value={{
        cities,
        selectedCity,
        setSelectedCity: handleSelectCity,
        isCityModalOpen,
        setCityModalOpen,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCity must be used within CityProvider');
  return context;
};
