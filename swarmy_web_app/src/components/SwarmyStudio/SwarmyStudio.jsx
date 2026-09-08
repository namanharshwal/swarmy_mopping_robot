import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import { TaskNode, ActionNode, LogicNode } from './CustomNodes';

const nodeTypes = {
  taskNode: TaskNode,
  actionNode: ActionNode,
  logicNode: LogicNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'granite_bear' },
    position: { x: 250, y: 50 },
    style: { 
      background: '#ffffff', 
      color: '#334155', 
      border: '1px solid #e2e8f0', 
      borderRadius: '24px', 
      padding: '8px 24px', 
      fontWeight: '600',
      fontSize: '13px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function SwarmyStudio() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback((params) => {
    let edgeColor = '#94a3b8'; // Default neutral
    if(params.sourceHandle === 'success') edgeColor = '#10b981'; // Green for success
    if(params.sourceHandle === 'failure') edgeColor = '#ef4444'; // Red for failure
    
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep',
      style: { stroke: edgeColor, strokeWidth: 1.5 },
      animated: params.sourceHandle === 'success' || params.sourceHandle === 'failure' ? false : true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
    }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');
      const subline = event.dataTransfer.getData('application/reactflow/subline');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label, subline },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
      <ReactFlowProvider>
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, display: 'flex', gap: '12px' }}>
            <button style={{ padding: '8px 16px', background: '#0ea5e9', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '500', fontSize: '13px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Update
            </button>
            <button style={{ padding: '8px 16px', background: '#0284c7', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '500', fontSize: '13px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Update and Exit
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={4}
          >
            <Controls style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }} showInteractive={false} />
            <Background color="#cbd5e1" gap={20} size={1.5} />
          </ReactFlow>
          
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  );
}
