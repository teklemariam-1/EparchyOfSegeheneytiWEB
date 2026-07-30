/**
 * The organisational tree of the eparchy, built from office parent links.
 *
 * Staff shape the whole thing from the admin — reparenting or reordering an
 * office changes the public tree with no code change. Which means staff can
 * also, inevitably, point A at B and B at A. The builder's first duty is that
 * a cycle DEGRADES the tree instead of hanging the About page: every node is
 * placed exactly once, cycle members surface as roots, and the walk is bounded
 * by construction rather than by trust in the data.
 */

export interface StructureOffice {
  id: string
  slug: string
  name: string
  leaderName?: string
  leaderRole?: string
  /** Parent office id, or null for a root. */
  parentId: string | null
  structureOrder?: number | null
  /** True when the office carries any structure signal at all. */
  inStructure: boolean
}

export interface StructureNode {
  office: StructureOffice
  children: StructureNode[]
}

/**
 * Build the forest.
 *
 * Included: every office that has a parent, is a parent, or set an order —
 * i.e. it opted into the tree. Offices with no structure data at all stay out,
 * so the About section can hide itself when nobody has configured anything.
 *
 * Cycle handling: a node whose parent chain never reaches a root is part of a
 * cycle. Each cycle member is promoted to a root (rendering what exists beats
 * rendering nothing), and `cycleDetected` tells the caller so the admin can be
 * warned in logs. Unknown parent ids (deleted or unpublished offices) are
 * treated as "no parent" for the same reason.
 */
export function buildStructureTree(offices: StructureOffice[]): {
  roots: StructureNode[]
  cycleDetected: boolean
} {
  const parentIds = new Set(offices.map((o) => o.parentId).filter(Boolean) as string[])
  const included = offices.filter(
    (o) => o.inStructure || o.parentId !== null || parentIds.has(o.id),
  )
  const byId = new Map(included.map((o) => [o.id, o]))

  // Classify each node by walking its parent chain. The visited set bounds the
  // walk: a chain longer than the node count has revisited something.
  const rootLike = new Set<string>()
  let cycleDetected = false

  for (const office of included) {
    const seen = new Set<string>([office.id])
    let current = office
    for (;;) {
      const parent = current.parentId !== null ? byId.get(current.parentId) : undefined
      if (!parent) {
        // Real root, or a parent outside the tree (deleted/unpublished).
        rootLike.add(current.id)
        break
      }
      if (seen.has(parent.id)) {
        // The chain closed on itself: promote THIS node so the cycle's members
        // all end up reachable as roots rather than orphaned.
        cycleDetected = true
        rootLike.add(office.id)
        break
      }
      seen.add(parent.id)
      current = parent
    }
  }

  const nodeFor = new Map<string, StructureNode>(
    included.map((o) => [o.id, { office: o, children: [] } as StructureNode]),
  )

  const roots: StructureNode[] = []
  for (const office of included) {
    const node = nodeFor.get(office.id)!
    const parentNode =
      office.parentId !== null && !rootLike.has(office.id) ? nodeFor.get(office.parentId) : undefined
    if (parentNode) parentNode.children.push(node)
    else roots.push(node)
  }

  const byOrder = (a: StructureNode, b: StructureNode) => {
    const ao = a.office.structureOrder ?? Number.MAX_SAFE_INTEGER
    const bo = b.office.structureOrder ?? Number.MAX_SAFE_INTEGER
    return ao === bo ? a.office.name.localeCompare(b.office.name) : ao - bo
  }
  const sortDeep = (nodes: StructureNode[]) => {
    nodes.sort(byOrder)
    nodes.forEach((n) => sortDeep(n.children))
  }
  sortDeep(roots)

  return { roots, cycleDetected }
}
