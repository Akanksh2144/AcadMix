import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, Connection, addEdge } from '@xyflow/react';

// In a real app, you'd use a robust signaling server.
const SIGNALING_SERVERS = ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'];

export function useCollaboration(initialNodes: Node[], initialEdges: Edge[], roomId: string, user: any, isHost: boolean, lockCircuit: boolean = false) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Host state
  const [pendingGuests, setPendingGuests] = useState<any[]>([]);
  
  // Guest state
  const [guestStatus, setGuestStatus] = useState<'idle' | 'confirming' | 'waiting' | 'accepted' | 'rejected'>(isHost ? 'idle' : 'confirming');

  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebrtcProvider | null>(null);
  const waitingProviderRef = useRef<WebrtcProvider | null>(null);
  
  const yNodesRef = useRef<Y.Map<Node>>(ydocRef.current.getMap('nodes'));
  const yEdgesRef = useRef<Y.Map<Edge>>(ydocRef.current.getMap('edges'));
  const yLayerVisibilityRef = useRef<Y.Map<boolean>>(ydocRef.current.getMap('layerVisibility'));
  const yUndoManagerRef = useRef<Y.UndoManager | null>(null);

  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    TopLayer: true, BottomLayer: true, TopSilkLayer: true, BoardOutline: true
  });

  // Connects to the main synchronous room
  const connectMainRoom = useCallback(() => {
    if (providerRef.current) return; // already connected

    const ydoc = ydocRef.current;
    const provider = new WebrtcProvider(roomId, ydoc, {
      signaling: SIGNALING_SERVERS,
    });
    providerRef.current = provider;

    provider.on('synced', (isSynced: boolean) => {
      setConnected(isSynced);
    });

    const awareness = provider.awareness;
    awareness.setLocalStateField('user', {
      id: user?.id || `anon-${Math.random()}`,
      name: user?.name || `Engineer-${Math.floor(Math.random() * 1000)}`,
      role: user?.role || 'Guest',
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    });

    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values());
      setUsers(states.map(s => s.user).filter(Boolean));
    });
    
    // Initialize map if empty (only the first peer does this)
    if (yNodesRef.current.size === 0) {
      initialNodes.forEach(n => yNodesRef.current.set(n.id, n));
    }
    if (yEdgesRef.current.size === 0) {
      initialEdges.forEach(e => yEdgesRef.current.set(e.id, e));
    }
    if (yLayerVisibilityRef.current.size === 0) {
      Object.entries({ TopLayer: true, BottomLayer: true, TopSilkLayer: true, BoardOutline: true })
        .forEach(([k, v]) => yLayerVisibilityRef.current.set(k, v));
    }
  }, [roomId, user, initialNodes, initialEdges]);

  // Connects to the Waiting Room channel
  const connectWaitingRoom = useCallback(() => {
    if (waitingProviderRef.current) return;
    
    const waitingDoc = new Y.Doc();
    const waitingProvider = new WebrtcProvider(`${roomId}-waiting`, waitingDoc, {
      signaling: SIGNALING_SERVERS,
    });
    waitingProviderRef.current = waitingProvider;

    const awareness = waitingProvider.awareness;
    
    if (isHost) {
      awareness.setLocalStateField('type', 'host');
      awareness.setLocalStateField('responses', {});
      
      awareness.on('change', () => {
        const states = Array.from(awareness.getStates().values());
        const guests = states.filter(s => s.type === 'request' && s.profile);
        
        // Filter out guests we have already responded to
        const localResponses = awareness.getLocalState()?.responses || {};
        const newGuests = guests.map(g => g.profile).filter(p => !localResponses[p.id]);
        
        setPendingGuests(newGuests);
      });
    } else {
      // Guest behavior in waiting room
      awareness.setLocalStateField('type', 'request');
      awareness.setLocalStateField('profile', {
        id: user?.id || `anon-${Math.floor(Math.random() * 1000)}`,
        name: user?.name || 'Unknown User',
        role: user?.role || 'Guest',
        collegeId: user?.college_id || 'Unknown',
      });
      
      awareness.on('change', () => {
        const states = Array.from(awareness.getStates().values());
        const hostState = states.find(s => s.type === 'host');
        
        if (hostState && hostState.responses) {
          const myResponse = hostState.responses[user?.id];
          if (myResponse === 'accepted') {
            setGuestStatus('accepted');
            waitingProvider.destroy();
            waitingProviderRef.current = null;
            connectMainRoom();
          } else if (myResponse === 'rejected') {
            setGuestStatus('rejected');
            waitingProvider.destroy();
            waitingProviderRef.current = null;
          }
        }
      });
    }
  }, [roomId, isHost, user, connectMainRoom]);

  // Initial connection logic
  useEffect(() => {
    if (isHost) {
      // Host immediately connects to both
      connectMainRoom();
      connectWaitingRoom();
    }
    // Guests wait in 'confirming' state until joinWaitingRoom() is called manually
    
    // Remote node changes observer
    const nodeObserver = () => setNodes(Array.from(yNodesRef.current.values()));
    const edgeObserver = () => setEdges(Array.from(yEdgesRef.current.values()));
    const layerObserver = () => {
      const visibility: Record<string, boolean> = {};
      yLayerVisibilityRef.current.forEach((value, key) => { visibility[key] = value; });
      setLayerVisibility(visibility);
    };
    
    yNodesRef.current.observe(nodeObserver);
    yEdgesRef.current.observe(edgeObserver);
    yLayerVisibilityRef.current.observe(layerObserver);
    
    // Initialize UndoManager after the doc is ready
    if (!yUndoManagerRef.current) {
      yUndoManagerRef.current = new Y.UndoManager([yNodesRef.current, yEdgesRef.current]);
    }

    return () => {
      yNodesRef.current.unobserve(nodeObserver);
      yEdgesRef.current.unobserve(edgeObserver);
      yLayerVisibilityRef.current.unobserve(layerObserver);
      if (yUndoManagerRef.current) yUndoManagerRef.current.destroy();
      if (providerRef.current) providerRef.current.destroy();
      if (waitingProviderRef.current) waitingProviderRef.current.destroy();
      ydocRef.current.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, connectMainRoom, connectWaitingRoom]);

  // Action for Guest to confirm they want to join
  const joinWaitingRoom = useCallback(() => {
    if (!isHost && guestStatus === 'confirming') {
      setGuestStatus('waiting');
      connectWaitingRoom();
    }
  }, [isHost, guestStatus, connectWaitingRoom]);

  // Action for Host to accept a guest
  const acceptGuest = useCallback((guestId: string) => {
    if (!isHost || !waitingProviderRef.current) return;
    const awareness = waitingProviderRef.current.awareness;
    const currentResponses = awareness.getLocalState()?.responses || {};
    awareness.setLocalStateField('responses', { ...currentResponses, [guestId]: 'accepted' });
    setPendingGuests(prev => prev.filter(g => g.id !== guestId));
  }, [isHost]);

  // Action for Host to reject a guest
  const rejectGuest = useCallback((guestId: string) => {
    if (!isHost || !waitingProviderRef.current) return;
    const awareness = waitingProviderRef.current.awareness;
    const currentResponses = awareness.getLocalState()?.responses || {};
    awareness.setLocalStateField('responses', { ...currentResponses, [guestId]: 'rejected' });
    setPendingGuests(prev => prev.filter(g => g.id !== guestId));
  }, [isHost]);

  // --- Handlers ---

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      let nextNodes = applyNodeChanges(changes, nds);
      
      // If the circuit is locked together, distribute drag delta to all nodes
      if (lockCircuit) {
        // Find if there's a valid position change due to dragging
        const dragChange = changes.find(c => c.type === 'position' && c.dragging && c.position) as import('@xyflow/react').NodePositionChange;
        
        if (dragChange && dragChange.position) {
          const oldNode = nds.find(n => n.id === dragChange.id);
          if (oldNode) {
            const dx = dragChange.position.x - oldNode.position.x;
            const dy = dragChange.position.y - oldNode.position.y;
            
            // Only apply delta if there's actual movement
            if (dx !== 0 || dy !== 0) {
              nextNodes = nextNodes.map(n => {
                // The dragged node has already been moved by applyNodeChanges
                if (n.id === dragChange.id) return n;
                
                return {
                  ...n,
                  position: {
                    x: n.position.x + dx,
                    y: n.position.y + dy
                  }
                };
              });
            }
          }
        }
      }
      
      ydocRef.current.transact(() => {
        changes.forEach(change => {
          if (change.type === 'remove') yNodesRef.current.delete(change.id);
          else if (change.type === 'add') yNodesRef.current.set(change.item.id, change.item);
          // Apply changes or broadcast our updated nextNodes if locked
        });
        
        if (lockCircuit) {
          // If locked, we need to make sure ALL updated nodes are synced
          nextNodes.forEach(n => yNodesRef.current.set(n.id, n));
        } else {
          changes.forEach(change => {
            if (change.type === 'position' || change.type === 'select' || change.type === 'dimensions') {
              const updatedNode = nextNodes.find(n => n.id === change.id);
              if (updatedNode) yNodesRef.current.set(updatedNode.id, updatedNode);
            }
          });
        }
      });

      return nextNodes;
    });
  }, [lockCircuit]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const nextEdges = applyEdgeChanges(changes, eds);
      
      ydocRef.current.transact(() => {
        changes.forEach(change => {
          if (change.type === 'remove') yEdgesRef.current.delete(change.id);
          else if (change.type === 'add') yEdgesRef.current.set(change.item.id, change.item);
          else if (change.type === 'select') {
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

  const addNode = useCallback((node: Node) => {
    setNodes(nds => [...nds, node]);
    yNodesRef.current.set(node.id, node);
  }, []);

  const updateNodeProperty = useCallback((nodeId: string, field: string, value: any) => {
    setNodes(nds => {
      const nextNodes = nds.map(n => {
        if (n.id === nodeId) {
          const updatedNode = { ...n, data: { ...n.data, properties: { ...(n.data as any).properties, [field]: value } } };
          // If editing a dimension, push it back to style to resize the visual node
          if (field === 'width' || field === 'height') {
            updatedNode.style = { ...updatedNode.style, [field]: Number(value) };
          }
          return updatedNode;
        }
        return n;
      });
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
      Array.from(yEdgesRef.current.keys()).forEach(key => {
         const e = yEdgesRef.current.get(key);
         if (e && (e.source === nodeId || e.target === nodeId)) yEdgesRef.current.delete(key);
      });
    });
  }, []);

  const setGraph = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    ydocRef.current.transact(() => {
      Array.from(yNodesRef.current.keys()).forEach(k => yNodesRef.current.delete(k));
      Array.from(yEdgesRef.current.keys()).forEach(k => yEdgesRef.current.delete(k));
      newNodes.forEach(n => yNodesRef.current.set(n.id, n));
      newEdges.forEach(e => yEdgesRef.current.set(e.id, e));
    });
  }, []);

  const toggleLayerVisibility = useCallback((layer: string) => {
    const current = yLayerVisibilityRef.current.get(layer) ?? true;
    yLayerVisibilityRef.current.set(layer, !current);
  }, []);

  const undo = useCallback(() => {
    if (yUndoManagerRef.current) {
      yUndoManagerRef.current.undo();
    }
  }, []);

  const redo = useCallback(() => {
    if (yUndoManagerRef.current) {
      yUndoManagerRef.current.redo();
    }
  }, []);

  return {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnectEdges,
    addNode, updateNodeProperty, deleteNode, setGraph,
    connected, users,
    awareness: providerRef.current?.awareness,
    layerVisibility,
    toggleLayerVisibility,
    undo,
    redo,
    
    // Waiting Room exports
    isHost,
    guestStatus,
    pendingGuests,
    joinWaitingRoom,
    acceptGuest,
    rejectGuest,
  };
}
