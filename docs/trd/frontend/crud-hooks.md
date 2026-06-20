> [← Frontend TRD Index](./index.md)
>
> *Custom hooks (`use[Entities]`, `use[Entity]`) for CRUD operations — toast feedback, loading/error state, optimistic local updates. Components MUST call hooks, not services directly.*

## CRUD Operation Patterns

### 1. Hook-Based CRUD Operations
Each module MUST provide custom hooks for data operations:

```typescript
// modules/[module-name]/hooks/use[ModuleName].ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import [moduleName]Service from '../services/[moduleName]Service';
import { [Entity], PaginatedResponse, [Entity]SearchParams, Create[Entity]DTO, Update[Entity]DTO } from '../types/[moduleName].types';

export const use[Entities] = () => {
  const [[entities], set[Entities]] = useState<[Entity][]>([]);
  const [total[Entities], setTotal[Entities]] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch[Entities] = async (params: [Entity]SearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<[Entity]> = await [moduleName]Service.get[Entities](params);
      set[Entities](response.data);
      setTotal[Entities](response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch [entities]';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const create[Entity] = async ([entity]Data: Create[Entity]DTO) => {
    try {
      const new[Entity] = await [moduleName]Service.create[Entity]([entity]Data);
      set[Entities](prev => [new[Entity], ...prev]);
      setTotal[Entities](prev => prev + 1);
      toast.success('[Entity] created successfully');
      return new[Entity];
    } catch (err) {
      toast.error('Failed to create [entity]');
      throw err;
    }
  };

  const update[Entity] = async (id: string, [entity]Data: Update[Entity]DTO) => {
    try {
      const updated[Entity] = await [moduleName]Service.update[Entity](id, [entity]Data);
      set[Entities](prev => prev.map(item => item.id === id ? updated[Entity] : item));
      toast.success('[Entity] updated successfully');
      return updated[Entity];
    } catch (err) {
      toast.error('Failed to update [entity]');
      throw err;
    }
  };

  const delete[Entity] = async (id: string) => {
    try {
      await [moduleName]Service.delete[Entity](id);
      set[Entities](prev => prev.filter(item => item.id !== id));
      setTotal[Entities](prev => prev - 1);
      toast.success('[Entity] deleted successfully');
    } catch (err) {
      toast.error('Failed to delete [entity]');
      throw err;
    }
  };

  return {
    [entities],
    total[Entities],
    currentPage,
    isLoading,
    error,
    fetch[Entities],
    create[Entity],
    update[Entity],
    delete[Entity],
  };
};

export const use[Entity] = (id: string | null = null) => {
  const [[entity], set[Entity]] = useState<[Entity] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch[Entity] = async (entityId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await [moduleName]Service.get[Entity]ById(entityId);
      set[Entity](data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch [entity]';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetch[Entity](id);
    }
  }, [id]);

  return {
    [entity],
    isLoading,
    error,
    fetch[Entity],
    set[Entity],
  };
};
```

For form patterns that *consume* these hooks, see [forms.md](./forms.md). For service-layer implementation behind the hooks, see [api-services.md](./api-services.md).
