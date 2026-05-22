'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps<T> {
  label: string;
  items: T[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  getDisplayText: (item: T) => string;
  getSearchText: (item: T) => string;
  placeholder: string;
}

export default function SearchableSelect<T extends { id: number }>({
  label,
  items,
  selectedId,
  onSelect,
  getDisplayText,
  getSearchText,
  placeholder
}: SearchableSelectProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(item => item.id === selectedId);

  useEffect(() => {
    setShowInput(!selectedId);
  }, [selectedId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter(item => {
    const searchText = getSearchText(item).toLowerCase();
    return searchText.includes(searchQuery.toLowerCase());
  });

  const handleSelect = (item: T) => {
    onSelect(item.id);
    setSearchQuery('');
    setIsOpen(false);
    setShowInput(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
    setShowInput(true);
    setIsOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label} *
      </label>
      <div ref={wrapperRef} className="relative">
        {showInput ? (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
        ) : (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border-2 border-blue-500">
            <span className="text-gray-800">{selectedItem && getDisplayText(selectedItem)}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-500 hover:text-red-700 text-xl ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {isOpen && showInput && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  {getDisplayText(item)}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">該当なし</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
