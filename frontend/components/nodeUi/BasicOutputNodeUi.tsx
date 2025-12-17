import {observer} from 'mobx-react-lite';
import {Handle, Position, NodeProps} from '@xyflow/react';
import {MessageSquare, FileText} from 'lucide-react';
import {cn} from '@/lib/utils';
import {BaseNode} from '@/stores/nodes';

interface BasicOutputNodeData {
    status?: BaseNode.NodeStatus;
    label?: string;
    subType?: string;
}

const getSubTypeConfig = (subType: string = 'chat') => {
    switch (subType) {
        case 'report_generation':
            return {
                title: '报告生成',
                Icon: FileText,
                color: 'amber',
            };
        case 'chat':
        default:
            return {
                title: 'LLM',
                Icon: MessageSquare,
                color: 'blue',
            };
    }
};

export const BasicOutputNodeUi = observer((props: NodeProps) => {
    const data = props.data as BasicOutputNodeData;
    const status = data?.status ?? 'pending';
    const subType = data?.subType ?? 'chat';
    
    const config = getSubTypeConfig(subType);
    const Icon = config.Icon;
    const label = data?.label || config.title;

    const colorStyles = {
        amber: {
            pending: {
                container: 'border-amber-200 bg-amber-50/80',
                icon: 'bg-amber-100 text-amber-500',
                text: 'text-amber-700',
                handle: '!bg-amber-400',
            },
            running: {
                container: 'border-amber-400 bg-amber-50',
                icon: 'bg-amber-200 text-amber-600 animate-pulse',
                text: 'text-amber-800',
                handle: '!bg-amber-500',
            },
            finished: {
                container: 'border-green-300 bg-green-50/80',
                icon: 'bg-green-100 text-green-600',
                text: 'text-green-700',
                handle: '!bg-green-400',
            },
            error: {
                container: 'border-red-300 bg-red-50/80',
                icon: 'bg-red-100 text-red-600',
                text: 'text-red-700',
                handle: '!bg-red-400',
            },
        },
        blue: {
            pending: {
                container: 'border-blue-200 bg-blue-50/80',
                icon: 'bg-blue-100 text-blue-500',
                text: 'text-blue-700',
                handle: '!bg-blue-400',
            },
            running: {
                container: 'border-blue-400 bg-blue-50',
                icon: 'bg-blue-200 text-blue-600 animate-pulse',
                text: 'text-blue-800',
                handle: '!bg-blue-500',
            },
            finished: {
                container: 'border-green-300 bg-green-50/80',
                icon: 'bg-green-100 text-green-600',
                text: 'text-green-700',
                handle: '!bg-green-400',
            },
            error: {
                container: 'border-red-300 bg-red-50/80',
                icon: 'bg-red-100 text-red-600',
                text: 'text-red-700',
                handle: '!bg-red-400',
            },
        },
    };

    const styles = colorStyles[config.color as keyof typeof colorStyles][status];

    return (
        <div 
            className={cn(
                "relative rounded-xl border-2 shadow-md transition-all duration-300 px-4 py-3 min-w-[120px]",
                styles.container
            )}
        >
            {/* 顶部入口连接点 */}
            <Handle 
                type="target" 
                position={Position.Top} 
                className={cn("!w-3 !h-3 !border-2 !border-white !shadow-sm", styles.handle)}
            />
            
            {/* 节点内容 */}
            <div className="flex items-center gap-2">
                <div className={cn(
                    "p-1.5 rounded-lg",
                    styles.icon
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className={cn("text-sm font-semibold", styles.text)}>{label}</span>
            </div>

            {/* 底部出口连接点 */}
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className={cn("!w-3 !h-3 !border-2 !border-white !shadow-sm", styles.handle)}
            />
        </div>
    );
});
