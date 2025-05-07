import React, { useState } from 'react';
import { 
  FilterDrawer, 
  FilterField, 
  FilterValue, 
  FilterBadges, 
  FilterButton 
} from '../ui/filter-drawer';

const FilterExample: React.FC = () => {
  // Define available filter fields
  const filterFields: FilterField[] = [
    { 
      id: 'id', 
      label: 'ID', 
      type: 'text' 
    },
    { 
      id: 'name', 
      label: 'Name', 
      type: 'text' 
    },
    { 
      id: 'created', 
      label: 'Created', 
      type: 'dateRange'
    },
    { 
      id: 'updated', 
      label: 'Updated', 
      type: 'dateRange'
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' }
      ]
    }
  ];

  // State for managing the filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);

  // Handler for applying filters
  const handleApplyFilters = (filters: FilterValue[]) => {
    setActiveFilters(filters);
    console.log('Applied filters:', filters);
    
    // Here you would typically call your API with these filters
    // fetchData({ filters: filters });
  };

  // Handler for removing a single filter
  const handleRemoveFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(filter => filter.id !== id));
  };

  // Handler for resetting all filters
  const handleResetFilters = () => {
    setActiveFilters([]);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Items List</h1>
        
        <FilterButton
          onClick={() => setIsFilterOpen(true)}
          filterCount={activeFilters.length}
        />
      </div>
      
      <FilterBadges
        filters={activeFilters}
        fields={filterFields}
        onRemove={handleRemoveFilter}
        className="mb-4"
      />
      
      {/* Example table content would go here */}
      <div className="border rounded p-4">
        <p className="text-gray-500">Your data would be displayed here, filtered by the selected criteria.</p>
      </div>
      
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        fields={filterFields}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        initialValues={activeFilters}
      />
    </div>
  );
};

export default FilterExample; 