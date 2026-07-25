import type { GroupByResult, GroupedRow, Measure } from '../payload/aggregationConfig'

/**
 * Pure helpers for the GroupedTable UI: turn the flat combination rows returned
 * by the aggregation API into a collapsible tree, and export to CSV. Kept
 * DB/React-free so both the client component and unit tests can use them.
 */

export interface TreeNode {
  /** Group value at this level (already display-formatted; null → "(none)"). */
  value: string
  rowCount: number
  sums: Record<string, number>
  depth: number
  children: TreeNode[]
}

const NONE = '(none)'

function addSums(target: Record<string, number>, add: Record<string, number>) {
  for (const k of Object.keys(add)) target[k] = (target[k] ?? 0) + add[k]
}

/**
 * Build a nested tree from flat grouped rows following the group-by order.
 * Parent levels aggregate their descendants' counts and sums.
 */
export function buildTree(rows: GroupedRow[], groupBy: string[]): TreeNode[] {
  const roots: TreeNode[] = []
  // Map lookups per level keyed by the path so far.
  const index = new Map<string, TreeNode>()

  for (const row of rows) {
    let parentList = roots
    let path = ''
    for (let depth = 0; depth < groupBy.length; depth += 1) {
      const key = groupBy[depth]!
      const value = row.groups[key] ?? NONE
      path += ` ${value}`
      let node = index.get(path)
      if (!node) {
        node = { value, rowCount: 0, sums: {}, depth, children: [] }
        index.set(path, node)
        parentList.push(node)
      }
      node.rowCount += row.rowCount
      addSums(node.sums, row.sums)
      parentList = node.children
    }
  }
  return roots
}

/** Flatten a tree to visible rows given a set of collapsed node paths. */
export interface FlatNode extends TreeNode {
  path: string
  hasChildren: boolean
}

export function flattenTree(nodes: TreeNode[], collapsed: Set<string>, parentPath = ''): FlatNode[] {
  const out: FlatNode[] = []
  for (const node of nodes) {
    const path = `${parentPath} ${node.value}`
    const hasChildren = node.children.length > 0
    out.push({ ...node, path, hasChildren })
    if (hasChildren && !collapsed.has(path)) {
      out.push(...flattenTree(node.children, collapsed, path))
    }
  }
  return out
}

function csvCell(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Export the grouped result as CSV (one line per full-combination row + total). */
export function toCsv(
  result: Pick<GroupByResult, 'rows' | 'grandTotal' | 'measures'>,
  groupBy: string[],
  columnLabels: Record<string, string>,
  measureLabels: Record<string, string>,
): string {
  const header = [
    ...groupBy.map((k) => columnLabels[k] ?? k),
    'Rows',
    ...result.measures.map((m: Measure) => measureLabels[m.key] ?? m.label),
  ]
  const lines = [header.map(csvCell).join(',')]

  for (const row of result.rows) {
    const cells = [
      ...groupBy.map((k) => row.groups[k] ?? NONE),
      row.rowCount,
      ...result.measures.map((m) => row.sums[m.key] ?? 0),
    ]
    lines.push(cells.map(csvCell).join(','))
  }

  const totalCells = [
    'TOTAL',
    ...groupBy.slice(1).map(() => ''),
    result.grandTotal.rowCount,
    ...result.measures.map((m) => result.grandTotal.sums[m.key] ?? 0),
  ]
  lines.push(totalCells.map(csvCell).join(','))

  return lines.join('\n')
}
