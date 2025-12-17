import {observer} from 'mobx-react-lite';
import {Handle, Position, NodeProps} from '@xyflow/react';
import {Crown, Sparkles, Activity, CheckCircle2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {BaseNode} from '@/stores/nodes';

interface SupervisorNodeData {
    status?: BaseNode.NodeStatus;
    label?: string;
}

export const SupervisorNodeUi = observer((props: NodeProps) => {
    const data = props.data as SupervisorNodeData;
    const status = data?.status ?? 'pending';
    const label = data?.label || 'Supervisor';

    // Node dimensions from ReactFlow
    const { width, height } = props;

    const isRunning = status === 'running';
    const isFinished = status === 'finished';
    const isError = status === 'error';

    return (
        <div 
            className={cn(
                "relative rounded-3xl border-2 transition-all duration-500 ease-out backdrop-blur-xl overflow-hidden",
                // Base & Pending
                "bg-white/40 border-slate-200/60 shadow-sm",
                // Running
                isRunning && "border-indigo-400/60 bg-white/60 shadow-[0_0_40px_-10px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/10",
                // Finished
                isFinished && "border-slate-300/60 bg-white/60",
                // Error
                isError && "border-rose-300 bg-rose-50/20"
            )}
            style={{
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
            }}
        >
            {/* Top Handle */}
            <Handle 
                type="target" 
                position={Position.Top} 
                className={cn(
                    "!w-3 !h-3 !border-[3px] !border-white transition-all duration-300 z-50",
                    "!bg-slate-300",
                    isRunning && "!bg-indigo-500 !w-4 !h-4",
                    isFinished && "!bg-emerald-500"
                )}
            />
            
            {/* Header Area */}
            <div className={cn(
                "flex items-center gap-2 px-4 py-3 border-b transition-colors duration-300",
                "border-slate-100/50",
                isRunning && "bg-indigo-50/50 border-indigo-100/50",
                isFinished && "bg-slate-50/50"
            )}>
                <div className={cn(
                    "p-1.5 rounded-lg shadow-sm transition-all duration-500",
                    "bg-white text-slate-400",
                    isRunning && "bg-indigo-500 text-white scale-110 shadow-indigo-200",
                    isFinished && "bg-emerald-500 text-white shadow-emerald-200",
                    isError && "bg-rose-500 text-white"
                )}>
                    {isRunning ? <Activity className="h-4 w-4 animate-pulse" /> : <Crown className="h-4 w-4" />}
                </div>
                
                <div className="flex flex-col">
                    <span className={cn(
                        "text-sm font-bold tracking-tight transition-colors duration-300",
                        "text-slate-600",
                        isRunning && "text-indigo-900",
                        isFinished && "text-slate-800"
                    )}>
                        {label}
                    </span>
                    {isRunning && (
                        <span className="text-[10px] uppercase font-semibold text-indigo-500 animate-pulse">
                            Orchestrating...
                        </span>
                    )}
                </div>
                
                <div className="flex-1" />
                
                {/* Status Badge */}
                {isFinished && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </div>

            {/* Subgraph Container Area */}
            {/* ReactFlow renders child nodes absolutely on top of this container. 
                We provide a subtle background here to group them visually. */}
            <div className={cn(
                "relative w-full flex-1 transition-colors duration-500",
                "bg-slate-50/20",
                isRunning && "bg-gradient-to-b from-indigo-50/30 to-transparent"
            )}>
                {/* Optional decorative background pattern could go here */}
            </div>

            {/* Bottom Handle */}
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className={cn(
                    "!w-3 !h-3 !border-[3px] !border-white transition-all duration-300 z-50",
                    "!bg-slate-300",
                    isRunning && "!bg-indigo-500 !w-4 !h-4",
                    isFinished && "!bg-emerald-500"
                )}
            />
        </div>
    );
});
