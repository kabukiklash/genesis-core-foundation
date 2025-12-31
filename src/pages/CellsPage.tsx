import { useQuery } from '@tanstack/react-query';
import { fetchCells } from '@/services/genesisApi';
import { CellListItem } from '@/components/genesis/CellCard';
import type { CellState } from '@/types/genesis';
import { useState } from 'react';

export default function CellsPage() {
  const [stateFilter, setStateFilter] = useState<CellState | ''>('');
  const { data: cells = [], isLoading } = useQuery({
    queryKey: ['cells', stateFilter],
    queryFn: () => fetchCells(stateFilter ? { state: [stateFilter] } : undefined),
  });

  const states: CellState[] = ['CANDIDATE', 'RUNNING', 'COOLING', 'DONE', 'ERROR'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">GenesisCells</h2>
        <p className="text-muted-foreground">All memory cells in the runtime</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setStateFilter('')} className={`px-3 py-1 rounded text-sm ${!stateFilter ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>All</button>
        {states.map(s => (
          <button key={s} onClick={() => setStateFilter(s)} className={`px-3 py-1 rounded text-sm font-mono ${stateFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{s}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {cells.map(cell => <CellListItem key={cell.id} cell={cell} />)}
        </div>
      )}
    </div>
  );
}
