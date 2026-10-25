// Preserve the existing menu order within each section and the first-seen section order.
export function groupProducts<T extends {category?: string | null}>(products: T[]) {
  const groups = new Map<string, {product: T; index: number}[]>();
  products.forEach((product, index) => {
    const category = product.category?.trim() || 'أطباقنا';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push({product, index});
  });
  return Array.from(groups, ([category, products]) => ({category, products}));
}
