import {observer} from 'mobx-react-lite';
import {Handle, Position, NodeProps} from '@xyflow/react';
import {Wrench} from 'lucide-react';
import {cn} from '@/lib/utils';

interface ToolCallNodeData {
    status?: 'pending' | 'running' | 'done';
    tool_name?: string;
}

export const ToolCallNodeUi = observer((props: NodeProps) => {
    const data = props.data as ToolCallNodeData;
    const status = data?.status ?? 'pending';
    const toolName = data?.tool_name || '工具调用';

    const statusStyles = {
        pending: 'border-muted-foreground/30 bg-background',
        running: 'border-orange-500 bg-orange-50 animate-pulse',
        done: 'border-green-500 bg-green-50',
    };

    return (
        <div className={cn(
            "relative px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] transition-all duration-300",
            statusStyles[status]
        )}>
            <Handle 
                type="target" 
                position={Position.Top} 
                className="!w-2 !h-2 !bg-muted-foreground/50 !border-0"
            />
            <div className="flex items-center gap-2">
                <div className={cn(
                    "p-1.5 rounded-lg",
                    status === 'done' ? 'bg-green-100 text-green-600' : 
                    status === 'running' ? 'bg-orange-100 text-orange-600' : 
                    'bg-muted text-muted-foreground'
                )}>
                    <Wrench className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground/80">{toolName}</span>
            </div>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className="!w-2 !h-2 !bg-muted-foreground/50 !border-0"
            />
        </div>
    );
});
