export class DataLayer {
  constructor() {
    this.relational = new Map()
    this.vector = new Map()
    this.graph = { nodes: new Map(), edges: [] }
    this.fileIndex = new Map()
    this.objects = new Map()
    this.events = []
  }

  put(table, id, value) {
    if (!this.relational.has(table)) this.relational.set(table, new Map())
    this.relational.get(table).set(id, value)
    return value
  }

  embed(id, vector, metadata = {}) {
    this.vector.set(id, { id, vector, metadata })
    return this.vector.get(id)
  }

  link(from, to, type = 'related') {
    if (!this.graph.nodes.has(from)) this.graph.nodes.set(from, { id: from })
    if (!this.graph.nodes.has(to)) this.graph.nodes.set(to, { id: to })
    const edge = { from, to, type }
    this.graph.edges.push(edge)
    return edge
  }

  indexFile(path, metadata = {}) {
    this.fileIndex.set(path, { path, ...metadata, indexedAt: new Date().toISOString() })
    return this.fileIndex.get(path)
  }

  putObject(key, value) {
    this.objects.set(key, value)
    return { key, stored: true }
  }

  query(table, predicate = () => true) {
    return [...(this.relational.get(table)?.values() || [])].filter(predicate)
  }

  snapshot() {
    return {
      relationalTables: this.relational.size,
      relationalRows: [...this.relational.values()].reduce((sum, table) => sum + table.size, 0),
      vectorRecords: this.vector.size,
      graphNodes: this.graph.nodes.size,
      graphEdges: this.graph.edges.length,
      indexedFiles: this.fileIndex.size,
      objects: this.objects.size,
      stores: ['relational', 'vector', 'graph', 'file-index', 'object-store'],
    }
  }
}
