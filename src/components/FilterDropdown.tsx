import React, { useState, useRef, useEffect } from 'react';


export interface Filter {
  type: string; 
  label: string; 
  values: string[]; 
}

interface FilterDropdownProps {
 
  options: Record<string, string[]>;
 
  appliedFilters: Filter[];
 
  onApplyFilters: (filters: Filter[]) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ options, appliedFilters, onApplyFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [currentTab, setCurrentTab] = useState<string>(Object.keys(options)[0]);
  
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 
  const openTab = (tab: string) => {
    setCurrentTab(tab);
    const existingFilter = appliedFilters.find(f => f.type === tab);
    setSelectedValues(existingFilter?.values || []);
  };

  
  const toggleOption = (option: string) => {
    setSelectedValues(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  
  const handleApply = () => {
   
    let newFilters = appliedFilters.filter(f => f.type !== currentTab);
    
    if (selectedValues.length > 0) {
      newFilters.push({
        type: currentTab,
        label: currentTab, 
        values: selectedValues
      });
    }
    onApplyFilters(newFilters);
    setIsOpen(false);
  };


  const handleRemoveFilter = (type: string) => {
    onApplyFilters(appliedFilters.filter(f => f.type !== type));
  };

  return (
    <div className="w-full">
      <div className="relative inline-block text-left" ref={ref}>
       
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
            
              openTab(Object.keys(options)[0]);
            }
          }}
          className="border rounded-lg px-4 py-2 bg-white text-gray-700 shadow-sm"
        >
          Filter
        </button>

       
        {isOpen && (
          <div className="origin-top-left absolute left-0 mt-2 w-80  rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="flex border-b">
              {Object.keys(options).map(tab => (
                <button
                  key={tab}
                  onClick={() => openTab(tab)}
                  className={`flex-1 px-4 py-2 text-sm capitalize ${currentTab === tab ? 'font-bold border-b-2 border-sky-400' : 'text-gray-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              {(options[currentTab] || []).map(option => (
                <div key={option} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer" onClick={() => toggleOption(option)}>
                  <input type="checkbox" className="mr-2 h-4 w-4 accent-sky-500 cursor-pointer " checked={selectedValues.includes(option)} readOnly />
                  <span className="text-sm">{option}</span>
                </div>
              ))}
            </div>

            <div className="border-t px-4 py-3">
              <button onClick={handleApply} className="w-full bg-sky-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-sky-600">
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

     
      <div className="flex flex-wrap gap-2 mt-4">
        {appliedFilters.map(filter => (
          <div key={filter.type} className="flex items-center bg-sky-100 text-sky-600 rounded-full px-3 py-1 text-sm">
            <span className="font-semibold mr-1">{filter.label}:</span>
            <span>{filter.values.join(', ')}</span>
            <button onClick={() => handleRemoveFilter(filter.type)} className="ml-2 font-bold text-sky-500 hover:text-sky-700">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterDropdown;
