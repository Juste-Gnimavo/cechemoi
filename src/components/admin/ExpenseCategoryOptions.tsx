// Options de <select> hiérarchisées pour les catégories de dépenses :
// catégories principales en <optgroup> avec leurs sous-catégories, catégories
// sans enfants en <option> simples. Une catégorie principale reste
// sélectionnable (« — général ») car elle peut porter des dépenses directes.

interface CategoryLike {
  id: string
  name: string
  parentId?: string | null
}

export function groupExpenseCategories<T extends CategoryLike>(
  categories: T[]
): { root: T; children: T[] }[] {
  const byId = new Set(categories.map((c) => c.id))
  const childrenByParent = new Map<string, T[]>()
  const roots: T[] = []
  for (const c of categories) {
    // Parent disparu → traiter comme catégorie principale (défensif)
    if (c.parentId && byId.has(c.parentId)) {
      const arr = childrenByParent.get(c.parentId) || []
      arr.push(c)
      childrenByParent.set(c.parentId, arr)
    } else {
      roots.push(c)
    }
  }
  return roots.map((root) => ({ root, children: childrenByParent.get(root.id) || [] }))
}

export function ExpenseCategoryOptions({ categories }: { categories: CategoryLike[] }) {
  const grouped = groupExpenseCategories(categories)
  return (
    <>
      {grouped.map(({ root, children }) =>
        children.length > 0 ? (
          <optgroup key={root.id} label={root.name}>
            <option value={root.id}>{root.name} — général</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        ) : (
          <option key={root.id} value={root.id}>
            {root.name}
          </option>
        )
      )}
    </>
  )
}
