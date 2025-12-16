import {AnyEvent} from '../events';
import { BaseNode } from './BaseNode';
import { ClarifyWithUserNode } from './ClarifyWithUserNode';
import { BriefGenerationNode } from './BriefGenerationNode';
import { UserNode } from './UserNode';
import { SupervisorNode } from './SupervisorNode';
import { ResearcherNode } from './ResearcherNode';
import { ToolCallNode } from './ToolCallNode';

export function createNodeFactory(type: BaseNode.NodeType, toolCallName?: string): BaseNode {
    switch (type) {
        case 'ClarifyWithUser':
            return ClarifyWithUserNode.createNew();
        case 'BriefGeneration':
            return BriefGenerationNode.createNew();
        case 'User':
            return UserNode.createNew();
        case 'Supervisor':
            return SupervisorNode.createNew();
        case 'Researcher':
            return ResearcherNode.createNew();
        case 'ToolCall':
            return ToolCallNode.createNew(toolCallName);
        default:
            throw new Error(`Unknown node type: ${type}`);
    }
}