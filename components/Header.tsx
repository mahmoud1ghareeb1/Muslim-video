import React from 'react';
import { PlusIcon, SearchIcon } from './Icons';

interface HeaderProps {
  onAddClick: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddClick, onSearch }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-teal-600 dark:text-teal-400 shrink-0 hidden sm:block">
          أرشيف الفيديوهات
        </h1>
        
        <div className="relative flex-grow max-w-xl mx-auto">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="ابحث بالاسم أو الرابط..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Search videos"
          />
        </div>

        <button
          onClick={onAddClick}
          className="bg-teal-600 text-white flex items-center gap-2 font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 shrink-0"
        >
          <PlusIcon />
          <span className="hidden sm:inline">إضافة رابط</span>
        </button>
      </div>
    </header>
  );
};

export default Header;