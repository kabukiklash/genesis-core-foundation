import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimulatedCell } from '@/types/vibecode';

interface SimulatedLogTabsProps {
  logs: Array<{ event_type: string; timestamp: string }>;
  cell: SimulatedCell | null;
}

export function SimulatedLogTabs({ logs, cell }: SimulatedLogTabsProps) {
  return (
    <Tabs defaultValue="log" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="log">Log</TabsTrigger>
        <TabsTrigger value="state">Estado</TabsTrigger>
      </TabsList>
      <TabsContent value="log" className="mt-2">
        <ScrollArea className="h-[150px] rounded border bg-muted/30 p-2">
          <pre className="text-xs font-mono">
            {logs.length > 0
              ? JSON.stringify(logs, null, 2)
              : '// Nenhum evento processado'}
          </pre>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="state" className="mt-2">
        <ScrollArea className="h-[150px] rounded border bg-muted/30 p-2">
          <pre className="text-xs font-mono">
            {cell
              ? JSON.stringify(
                  {
                    genesis_cells_current: {
                      [cell.cell_id]: {
                        type: cell.type,
                        state: cell.state,
                        friction: cell.friction,
                        retention: cell.retention,
                      },
                    },
                  },
                  null,
                  2
                )
              : '// Célula não disponível'}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
