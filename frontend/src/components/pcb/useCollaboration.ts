import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, Connection, addEdge } from '@xyflow/react';

const ROOM_NAME = 'acadmix-pcb-room-1';
// In a real app, you'd use a robust signaling server.
const SIGNALING_SERVERS = ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'];

export function useCollaboration(initialNodes: Node[], initialEdges: Edge[]) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebrtcProvider | null>(null);
  
  const yNodesRef = useRef<Y.Map<Node>>(ydocRef.current.getMap('nodes'));
  const yEdgesRef = useRef<Y.Map<Edge>>(ydocRef.current.getMap('edges'));

  // Initialize Yjs and WebRTC
  useEffect(() => {
    const ydoc = ydocRef.current;
    const provider = new WebrtcProvider(ROOM_NAME, ydoc, {
      signaling: SIGNALING_SERVERS,
    });
    providerRef.current = provider;

    provider.on('synced', (isSynced: boolean) => {
      setConnected(isSynced);
    });

    const awareness = provider.awareness;
    // Set local user info
    awareness.setLocalStateField('user', {
      name: `Engineer-${Math.floor(Math.random() * 1000)}`,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    });

    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values());
      setUsers(states.map(s => s.user).filter(Boolean));
    });

    // Handle remote Node changes
    yNodesRef.current.observe((event) => {
      // If we are making local changes, we don't want to overwrite ourselves immediately if we can avoid it.
      // But Yjs handles this nicely. We just sync the Map back to the React state.
      // To optimize, we could only apply remote changes.
      // For simplicity, we just rebuild the array from the map on every change.
      setNodes(Array.from(yNodesRef.current.values()));
    });

    // Handle remote Edge changes
    yEdgesRef.current.observe((event) => {
      setEdges(Array.from(yEdgesRef.current.values()));
    });

    // Initialize map if empty (only the first peer does this)
    if (yNodesRef.current.size === 0) {
      initialNodes.forEach(n => yNodesRef.current.set(n.id, n));
    }
    if (yEdgesRef.current.size === 0) {
      initialEdges.forEach(e => yEdgesRef.current.set(e.id, e));
    }

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const nextNodes = applyNodeChanges(changes, nds);
      
      // Sync to Yjs Map
      ydocRef.current.transact(() => {
        changes.forEach(change => {
          if (change.type === 'remove') {
            yNodesRef.current.delete(change.id);
          } else if (change.type === 'add') {
            yNodesRef.current.set(change.item.id, change.item);
          } else if (change.type === 'position' || change.type === 'select' || change.type === 'dimensions') {
            // Find the updated node
            const updatedNode = nextNodes.find(n => n.id === change.id);
            if (updatedNode) {
              yNodesRef.current.set(updatedNode.id, updatedNode);
            }
          }
        });
      });

      return nextNodes;
    });
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const nextEdges = applyEdgeChanges(changes, eds);
      
      ydocRef.current.transact(() => {
        changes.forEach(change => {
          if (change.type === 'remove') {
            yEdgesRef.current.delete(change.id);
          } else if (change.type === 'add') {
            yEdgesRef.current.set(change.item.id, change.item);
          } else if (change.type === 'select') {
             const updatedEdge = nextEdges.find(e => e.id === change.id);
             if (updatedEdge) yEdgesRef.current.set(updatedEdge.id, updatedEdge);
          }
        });
      });

      return nextEdges;
    });
  }, []);

  const onConnectEdges = useCallback((connection: Connection, type: string, layer: string, color: string) => {
    setEdges((eds) => {
      const newEdge = { ...connection, id: `e${connection.source}-${connection.target}`, type, data: { layer }, style: { stroke: color, strokeWidth: 3, mixBlendMode: 'screen' } } as unknown as Edge;
      const nextEdges = addEdge(newEdge, eds);
      yEdgesRef.current.set(newEdge.id, newEdge);
      return nextEdges;
    });
  }, []);

  // For adding custom nodes
  const addNode = useCallback((node: Node) => {
    setNodes(nds => [...nds, node]);
    yNodesRef.current.set(node.id, node);
  }, []);

  // For property updates
  const updateNodeProperty = useCallback((nodeId: string, field: string, value: any) => {
    setNodes(nds => {
      const nextNodes = nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, properties: { ...(n.data as any).properties, [field]: value } } } : n);
      const updated = nextNodes.find(n => n.id === nodeId);
      if (updated) yNodesRef.current.set(updated.id, updated);
      return nextNodes;
    });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    ydocRef.current.transact(() => {
      yNodesRef.current.delete(nodeId);
      // Delete associated edges
      Array.from(yEdgesRef.current.keys()).forEach(key => {
         const e = yEdgesRef.current.get(key);
         if (e && (e.source === nodeId || e.target === nodeId)) {
            yEdgesRef.current.delete(key);
         }
      });
    });
  }, []);

  // Set the canvas graph (from DSL code to visual)
  const setGraph = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    ydocRef.current.transact(() => {
      // Clear
      Array.from(yNodesRef.current.keys()).forEach(k => yNodesRef.current.delete(k));
      Array.from(yEdgesRef.current.keys()).forEach(k => yEdgesRef.current.delete(k));
      // Set new
      newNodes.forEach(n => yNodesRef.current.set(n.id, n));
      newEdges.forEach(e => yEdgesRef.current.set(e.id, e));
    });
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnectEdges,
    addNode,
    updateNodeProperty,
    deleteNode,
    setGraph,
    connected,
    users,
    awareness: providerRef.current?.awareness
  };
}
