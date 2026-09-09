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
    data: { label: 'START_FLOW' },
    position: { x: 250, y: 50 },
    style: { 
      background: 'rgba(20, 25, 35, 0.95)', 
      color: '#22d3ee', 
      border: '1px solid #22d3ee', 
      borderRadius: '24px', 
      padding: '10px 30px', 
      fontWeight: '600',
      fontSize: '14px',
      boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)',
      fontFamily: '"Orbitron", sans-serif',
      letterSpacing: '1px'
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
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback((params) => {
    let edgeColor = '#94a3b8';
    if(params.sourceHandle === 'success') edgeColor = '#10b981';
    if(params.sourceHandle === 'failure') edgeColor = '#ef4444';
    
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep',
      style: { stroke: edgeColor, strokeWidth: 2 },
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
        data: { label, subline, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    // Also update selectedNode state so the panel reflects changes instantly
    setSelectedNode((prev) => {
      if (prev && prev.id === nodeId) {
        return { ...prev, data: { ...prev.data, ...newData } };
      }
      return prev;
    });
  }, [setNodes]);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/workflow/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('swarmy_token')}` },
        body: JSON.stringify({ nodes, edges })
      });
      if (response.ok) alert('Workflow saved successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRun = async () => {
    await handleSave();
    try {
      await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('swarmy_token')}` }
      });
      alert('Workflow execution started!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: 'transparent', fontFamily: '"Rajdhani", sans-serif' }}>
      <ReactFlowProvider>
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} className="btn-tech" style={{ padding: '8px 20px', fontSize: '14px', letterSpacing: '1px' }}>
              UPDATE
            </button>
            <button onClick={handleRun} className="btn-tech map-btn-red" style={{ padding: '8px 20px', fontSize: '14px', letterSpacing: '1px' }}>
              UPDATE & RUN
            </button>
          </div>

          <style>{`.react-flow__attribution { display: none !important; }`}</style>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            fitView
            minZoom={0.2}
            maxZoom={4}
          >
            <Controls style={{ background: 'rgba(20, 25, 35, 0.9)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }} showInteractive={false} />
            <Background color="#334155" gap={24} size={1.5} />
          </ReactFlow>
          
        </div>
        <Sidebar 
          selectedNode={selectedNode} 
          setSelectedNode={setSelectedNode} 
          updateNodeData={updateNodeData} 
        />
      </ReactFlowProvider>
    </div>
  );
}
