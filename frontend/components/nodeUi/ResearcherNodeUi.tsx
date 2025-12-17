import {observer} from 'mobx-react-lite';
import {Handle, Position, NodeProps} from '@xyflow/react';
import {Search} from 'lucide-react';
import {cn} from '@/lib/utils';
import {BaseNode} from '@/stores/nodes';

interface ResearcherNodeData {
    status?: BaseNode.NodeStatus;
    label?: string;
}

export const ResearcherNodeUi = observer((props: NodeProps) => {
    const data = props.data as ResearcherNodeData;
    const status = data?.status ?? 'pending';
    const label = data?.label || '研究员';

    const statusStyles = {
        pending: {
            container: 'border-cyan-200 bg-cyan-50/80',
            icon: 'bg-cyan-100 text-cyan-500',
            text: 'text-cyan-700',
        },
        running: {
            container: 'border-cyan-400 bg-cyan-50',
            icon: 'bg-cyan-200 text-cyan-600 animate-pulse',
            text: 'text-cyan-800',
        },
        finished: {
            container: 'border-green-300 bg-green-50/80',
            icon: 'bg-green-100 text-green-600',
            text: 'text-green-700',
        },
        error: {
            container: 'border-red-300 bg-red-50/80',
            icon: 'bg-red-100 text-red-600',
            text: 'text-red-700',
        },
    };

    const styles = statusStyles[status];

    return (
        <div 
            className={cn(
                "relative rounded-xl border-2 shadow-md transition-all duration-300 px-4 py-3 min-w-[140px]",
                styles.container
            )}
        >
            {/* 顶部入口连接点 */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white !shadow-sm"
            />
            
            {/* 节点内容 */}
            <div className="flex items-center gap-2">
                <div className={cn(
                    "p-1.5 rounded-lg",
                    styles.icon
                )}>
                    <Search className="h-4 w-4" />
                </div>
                <span className={cn("text-sm font-semibold", styles.text)}>{label}</span>
            </div>

            {/* 底部出口连接点 */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white !shadow-sm"
            />
        </div>
    );
});
