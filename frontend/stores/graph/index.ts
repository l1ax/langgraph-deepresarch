import {action, computed, observable} from 'mobx';
import {BaseNode, createNodeFactory, SupervisorNode, ResearcherNode} from '../nodes';
import {Edge as BaseEdge} from '../edges';
import {AnyEvent, BaseEvent, ToolCallEvent} from '../events';
import {Edge, Node} from '@xyflow/react';

export class Graph {
    static eventTypeToNodeType: Partial<Record<BaseEvent.EventType, BaseNode.NodeType>> = {
        '/ai/clarify': 'ClarifyWithUser',
        '/ai/brief': 'BriefGeneration',
        '/human/chat': 'User',
        '/supervisor/group': 'Supervisor',
        '/supervisor/tool_call': 'ToolCall',
        '/researcher/group': 'Researcher',
        '/researcher/tool_call': 'ToolCall',
    };

    static createNodeByEvent(event: AnyEvent): BaseNode<unknown> {
        const nodeType: BaseNode.NodeType | undefined = Graph.eventTypeToNodeType[event.eventType];

        if (!nodeType) {
            throw new Error(`Unknown event type: ${event.eventType}`);
        }

        const createNodeConfig: {type: BaseNode.NodeType, toolCallName?: string} = {
            type: nodeType
        }

        if (event instanceof ToolCallEvent) {
            createNodeConfig.toolCallName = (event as ToolCallEvent).toolName;
        }

        const node = createNodeFactory(createNodeConfig.type, createNodeConfig.toolCallName);
        node.id = event.id;
        node.data = event.content.data;
        node.status = event.status;
        if (event.parentId) {
            node.parentId = event.parentId;
        }

        return node;
    }

    @observable
    id: string = '';

    @observable
    nodes: BaseNode.INode<unknown>[] = [];

    @observable
    edges: BaseEdge.IEdge[] = [];

    @observable
    associatedNode: BaseNode.INode<unknown> | undefined = undefined;

    @action.bound
    restoreDataFromEvents(events: AnyEvent[]) {
        for (const event of events) {
            const targetNode: BaseNode.INode<unknown> | undefined = this.allNodes.find(node => node.id === event.id);
            if (targetNode) {
                targetNode.data = event.content.data;
                targetNode.status = event.status;
                return;
            }


            // TODO: 临时过滤
            if (!['/human/chat', '/ai/brief', '/ai/clarify', '/supervisor/group', '/supervisor/tool_call', '/researcher/group', '/researcher/tool_call'].includes(event.eventType)) {
                return;
            }

            const newNode = Graph.createNodeByEvent(event);
            this.addNodeToGraph(newNode);
        }
    }

    /** 处理节点从属的图 */
    @action.bound
    addNodeToGraph(newNode: BaseNode.INode<unknown>) {
        let graph: Graph = this;
        if (!newNode.parentId) {
            this.nodes.push(newNode);
        }
        else {
            const parentNode = this.allNodes.find(n => n.id === newNode.parentId)!;
            if (parentNode instanceof SupervisorNode || parentNode instanceof ResearcherNode) {
                graph = parentNode.graph;
                newNode.parentNode = parentNode;
                
                graph.nodes.push(newNode);
            }
        }

        newNode.associatedGraph = graph;
        this.handleNodePosition(graph, newNode);
        this.addEdge(graph, newNode);
    }

    @action.bound
    addEdge(graph: Graph, targetNode: BaseNode.INode<unknown>) {
        if (graph.nodes.length < 2) {
            return;
        }

        const sourceNode = graph.nodes[graph.nodes.length - 2];

        if (targetNode.parentId && targetNode.parentId === sourceNode.id) {
            return;
        }

        const edge = new BaseEdge(sourceNode.id, targetNode.id);
        graph.edges.push(edge);
    }
    
    @action.bound
    handleNodePosition(graph: Graph, newNode: BaseNode.INode<unknown>) {
        if (newNode.isBelongToSubGraph) {
            const parentNode = newNode.parentNode;
            if (!parentNode) {
                console.error('parentNode is undefined');
                return;
            }

            const childrenOfParent = graph.nodes.filter(n => n.parentId === parentNode.id);
            const childIndex = childrenOfParent.length;
            newNode.position = {
                x: 20 + childIndex * 100,
                y: 50
            };

            return;
        }

        newNode.position = {x: 0, y: (graph.nodes.length - 1) * 100};
    }

    @computed
    get reactFlowNodes(): Node[] {
        const result: Node[] = [];
        for (const node of this.nodes) {
            result.push(node.toReactFlowData());

            if (node instanceof SupervisorNode || node instanceof ResearcherNode) {
                result.push(...node.subflowReactFlowNodeData);
            }
        }
        return result;
    }

    @computed
    get reactFlowEdges(): Edge[] {
        const edges = this.edges.map(edge => ({
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
        }));

        console.log(edges);

        return edges;
    }

    @computed
    get allNodes(): BaseNode.INode<unknown>[] {
        return this.nodes.flatMap(node => {
            if (node instanceof SupervisorNode || node instanceof ResearcherNode) {
                return [node, ...node.graph.allNodes];
            }

            return node;
        });
    }

    @computed
    get isSubGraph(): boolean {
        return this.associatedNode !== undefined;
    }
}

export namespace Graph {

}