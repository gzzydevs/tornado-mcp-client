// MCP Connection Manager for handling multiple MCP servers
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  MCPServerConfig,
  MCPConnectionState,
  MCPServerInfo,
  MCPTool,
  MCPResource,
  MCPToolInvocation,
  MCPToolResult,
} from '../../shared/mcp-types';

/**
 * Manages connections to multiple MCP servers
 * Handles server lifecycle, tool invocation, and resource access
 */
export class MCPConnectionManager {
  private connections: Map<string, MCPConnection> = new Map();
  private stateListeners: Set<(states: Map<string, MCPConnectionState>) => void> = new Set();

  /**
   * Add a new MCP server configuration
   * @param config - Server configuration
   */
  async addServer(config: MCPServerConfig): Promise<void> {
    if (this.connections.has(config.id)) {
      throw new Error(`Server with ID ${config.id} already exists`);
    }

    const connection = new MCPConnection(config);
    this.connections.set(config.id, connection);

    // Connect if enabled
    if (config.enabled) {
      await this.connectServer(config.id);
    }

    this.notifyStateChange();
  }

  /**
   * Remove an MCP server
   * @param serverId - Server ID to remove
   */
  async removeServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Server ${serverId} not found`);
    }

    await connection.disconnect();
    this.connections.delete(serverId);
    this.notifyStateChange();
  }

  /**
   * Connect to an MCP server
   * @param serverId - Server ID to connect
   */
  async connectServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Server ${serverId} not found`);
    }

    await connection.connect();
    this.notifyStateChange();
  }

  /**
   * Disconnect from an MCP server
   * @param serverId - Server ID to disconnect
   */
  async disconnectServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Server ${serverId} not found`);
    }

    await connection.disconnect();
    this.notifyStateChange();
  }

  /**
   * Invoke a tool on an MCP server
   * @param invocation - Tool invocation details
   * @returns Tool execution result
   */
  async invokeTool(invocation: MCPToolInvocation): Promise<MCPToolResult> {
    const connection = this.connections.get(invocation.serverId);
    if (!connection) {
      throw new Error(`Server ${invocation.serverId} not found`);
    }

    return await connection.invokeTool(invocation.toolName, invocation.arguments);
  }

  /**
   * Get tools from all connected servers
   * @returns Map of server ID to tools
   */
  getAllTools(): Map<string, MCPTool[]> {
    const allTools = new Map<string, MCPTool[]>();
    
    for (const [serverId, connection] of this.connections.entries()) {
      const state = connection.getState();
      if (state.tools && state.tools.length > 0) {
        allTools.set(serverId, state.tools);
      }
    }
    
    return allTools;
  }

  /**
   * Get resources from all connected servers
   * @returns Map of server ID to resources
   */
  getAllResources(): Map<string, MCPResource[]> {
    const allResources = new Map<string, MCPResource[]>();
    
    for (const [serverId, connection] of this.connections.entries()) {
      const state = connection.getState();
      if (state.resources && state.resources.length > 0) {
        allResources.set(serverId, state.resources);
      }
    }
    
    return allResources;
  }

  /**
   * Get connection states for all servers
   * @returns Map of server ID to connection state
   */
  getStates(): Map<string, MCPConnectionState> {
    const states = new Map<string, MCPConnectionState>();
    
    for (const [serverId, connection] of this.connections.entries()) {
      states.set(serverId, connection.getState());
    }
    
    return states;
  }

  /**
   * Get connection state for a specific server
   * @param serverId - Server ID
   * @returns Connection state or undefined if not found
   */
  getState(serverId: string): MCPConnectionState | undefined {
    const connection = this.connections.get(serverId);
    return connection?.getState();
  }

  /**
   * Subscribe to connection state changes
   * @param listener - Callback function
   */
  onStateChange(listener: (states: Map<string, MCPConnectionState>) => void): () => void {
    this.stateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyStateChange(): void {
    const states = this.getStates();
    for (const listener of this.stateListeners) {
      listener(states);
    }
  }

  /**
   * Disconnect all servers and cleanup
   */
  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.values()).map(
      conn => conn.disconnect()
    );
    
    await Promise.all(disconnectPromises);
    this.connections.clear();
    this.stateListeners.clear();
  }
}

/**
 * Individual MCP server connection
 */
class MCPConnection {
  private config: MCPServerConfig;
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private state: MCPConnectionState;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.state = {
      serverId: config.id,
      status: 'disconnected',
    };
  }

  async connect(): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    this.state.status = 'connecting';
    this.state.error = undefined;

    try {
      // Create stdio transport for MCP server
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: this.config.env,
      });

      // Create MCP client
      this.client = new Client({
        name: 'tornado-mcp-client',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      // Connect to the server
      await this.client.connect(this.transport);

      // Get server info
      const serverInfo = await this.client.getServerVersion();
      this.state.info = {
        name: serverInfo.name,
        version: serverInfo.version,
        protocolVersion: serverInfo.protocolVersion,
        capabilities: serverInfo.capabilities,
      };

      // List available tools
      const toolsList = await this.client.listTools();
      this.state.tools = toolsList.tools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
      }));

      // List available resources
      try {
        const resourcesList = await this.client.listResources();
        this.state.resources = resourcesList.resources.map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        }));
      } catch (error) {
        // Some servers may not support resources
        console.log(`Server ${this.config.id} does not support resources`);
        this.state.resources = [];
      }

      this.state.status = 'connected';
      this.state.lastConnected = new Date();
      
      console.log(`Connected to MCP server: ${this.config.name}`);
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : String(error);
      console.error(`Failed to connect to MCP server ${this.config.name}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error(`Error disconnecting from ${this.config.name}:`, error);
      }
      this.client = null;
    }

    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.error(`Error closing transport for ${this.config.name}:`, error);
      }
      this.transport = null;
    }

    this.state.status = 'disconnected';
    console.log(`Disconnected from MCP server: ${this.config.name}`);
  }

  async invokeTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.client || this.state.status !== 'connected') {
      throw new Error(`Server ${this.config.id} is not connected`);
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      return {
        content: result.content.map(item => ({
          type: item.type as 'text' | 'image' | 'resource',
          text: 'text' in item ? item.text : undefined,
          data: 'data' in item ? item.data : undefined,
          mimeType: 'mimeType' in item ? item.mimeType : undefined,
        })),
        isError: result.isError,
      };
    } catch (error) {
      console.error(`Error invoking tool ${toolName}:`, error);
      throw error;
    }
  }

  getState(): MCPConnectionState {
    return { ...this.state };
  }

  getConfig(): MCPServerConfig {
    return { ...this.config };
  }
}
