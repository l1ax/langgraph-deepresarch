import {observer} from 'mobx-react-lite';
import {Handle, Position, NodeProps} from '@xyflow/react';
import {Crown, Users} from 'lucide-react';
import {cn} from '@/lib/utils';
import {BaseNode} from '@/stores/nodes';

interface SupervisorNodeData {
    status?: BaseNode.NodeStatus;
    label?: string;
    childCount?: number;
}

export const SupervisorNodeUi = observer((props: NodeProps) => {
    const data = props.data as SupervisorNodeData;
    const status = data?.status ?? 'pending';
    const label = data?.label || '研究主管';
    const childCount = data?.childCount ?? 0;

    // 根据子节点数量计算容器尺寸
    const minWidth = 100 + childCount * 120;
    const minHeight = childCount > 0 ? 120 : 80;

    const statusStyles = {
        pending: {
            container: 'border-purple-200 bg-purple-50/30',
            header: 'bg-purple-100/80 border-purple-200',
            icon: 'bg-purple-100 text-purple-500',
            text: 'text-purple-700',
        },
        running: {
            container: 'border-purple-400 bg-purple-50/50',
            header: 'bg-purple-200/80 border-purple-300',
            icon: 'bg-purple-200 text-purple-600 animate-pulse',
            text: 'text-purple-800',
        },
        finished: {
            container: 'border-green-300 bg-green-50/30',
            header: 'bg-green-100/80 border-green-200',
            icon: 'bg-green-100 text-green-600',
            text: 'text-green-700',
        },
        error: {
            container: 'border-red-300 bg-red-50/30',
            header: 'bg-red-100/80 border-red-200',
            icon: 'bg-red-100 text-red-600',
            text: 'text-red-700',
        },
    };

    const styles = statusStyles[status];

    return (
        <div 
            className={cn(
                "relative rounded-xl border-2 shadow-md transition-all duration-300 overflow-visible",
                styles.container
            )}
            style={{
                minWidth: `${minWidth}px`,
                minHeight: `${minHeight}px`,
            }}
        >
            {/* 顶部入口连接点 */}
            <Handle 
                type="target" 
                position={Position.Top} 
                className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white !shadow-sm"
            />
            
            {/* 头部栏 */}
            <div className={cn(
                "flex items-center gap-2 px-3 py-2 border-b",
                styles.header
            )}>
                <div className={cn(
                    "p-1.5 rounded-lg",
                    styles.icon
                )}>
                    <Crown className="h-4 w-4" />
                </div>
                <span className={cn("text-sm font-semibold", styles.text)}>{label}</span>
                <div className="flex-1" />
                {childCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-purple-500">
                        <Users className="h-3 w-3" />
                        <span>{childCount} 子节点</span>
                    </div>
                )}
            </div>

            {/* 子节点区域 - ReactFlow 会自动将 parentId 指向本节点的子节点渲染在这里 */}
            <div 
                className="relative w-full bg-gradient-to-b from-transparent to-purple-50/20"
                style={{ minHeight: childCount > 0 ? '80px' : '40px' }}
            >
                {/* 子节点由 ReactFlow 自动渲染 */}
            </div>

            {/* 底部出口连接点 */}
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white !shadow-sm"
            />
        </div>
    );
});

