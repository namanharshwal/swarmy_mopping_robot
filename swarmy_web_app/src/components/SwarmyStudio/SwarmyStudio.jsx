import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

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
    data: { label: 'START' },
    position: { x: 250, y: 25 },
    style: { background: '#222', color: '#00ffff', border: '1px solid #00ffff', borderRadius: '50px', padding: '10px 20px', fontWeight: 'bold' }
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
    let edgeColor = '#aaa';
    if(params.sourceHandle === 'success') edgeColor = '#00ff00';
    if(params.sourceHandle === 'failure') edgeColor = '#ff0000';
    
    setEdges((eds) => addEdge({ 
      ...params, 
      style: { stroke: edgeColor, strokeWidth: 2 },
      animated: true 
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
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#050811' }}>
      <ReactFlowProvider>
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
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
          >
            <Controls style={{ background: '#222', color: '#00ffff', border: '1px solid #00ffff' }} />
            <Background color="#222" gap={16} />
          </ReactFlow>
          
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px' }}>
            <button 
              style={{ padding: '10px 20px', background: '#00ff00', border: 'none', borderRadius: '5px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Orbitron', boxShadow: '0 0 10px rgba(0,255,0,0.5)' }}
            >
              RUN WORKFLOW
            </button>
            <button 
              style={{ padding: '10px 20px', background: '#ff0000', border: 'none', borderRadius: '5px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Orbitron', boxShadow: '0 0 10px rgba(255,0,0,0.5)' }}
            >
              STOP
            </button>
          </div>
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  );
}
