const dairyAssets = {
  heroMilk: 'https://images.pexels.com/photos/244579/pexels-photo-244579.jpeg?cs=srgb&dl=pexels-bamusiimesylvia-244579.jpg&fm=jpg',
  visitCenter: 'https://images.pexels.com/photos/37409094/pexels-photo-37409094.jpeg?cs=srgb&dl=pexels-florence-mathiot-417781-37409094.jpg&fm=jpg',
  testimonialFamily: 'https://images.pexels.com/photos/4152559/pexels-photo-4152559.jpeg?cs=srgb&dl=pexels-mikael-blomkvist-4152559.jpg&fm=jpg',
  testimonialDelivery: 'https://images.pexels.com/photos/17748230/pexels-photo-17748230.jpeg?cs=srgb&dl=pexels-ph-ng-khanh-623875464-17748230.jpg&fm=jpg',
  productCowMilk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  productBuffaloMilk: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=800',
  productTonedMilk: 'https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=800',
  productCurd: 'https://images.pexels.com/photos/6808666/pexels-photo-6808666.jpeg?auto=compress&cs=tinysrgb&w=800',
  productPaneer: 'https://images.pexels.com/photos/20379604/pexels-photo-20379604.jpeg?cs=srgb&dl=pexels-royalrouge-20379604.jpg&fm=jpg',
  productGhee: 'https://images.pexels.com/photos/12426032/pexels-photo-12426032.jpeg?auto=compress&cs=tinysrgb&w=800',
  productButtermilk: 'https://images.pexels.com/photos/4475024/pexels-photo-4475024.jpeg?auto=compress&cs=tinysrgb&w=800',
  genericProduct: 'https://images.pexels.com/photos/5946724/pexels-photo-5946724.jpeg?cs=srgb&dl=pexels-charlotte-may-5946724.jpg&fm=jpg',
  genericCategory: 'https://images.pexels.com/photos/5946717/pexels-photo-5946717.jpeg?cs=srgb&dl=pexels-charlotte-may-5946717.jpg&fm=jpg',
  genericSection: 'https://images.pexels.com/photos/5947086/pexels-photo-5947086.jpeg?cs=srgb&dl=pexels-charlotte-may-5947086.jpg&fm=jpg',
};

const dairyKeywords = [
  'milk',
  'dairy',
  'curd',
  'paneer',
  'ghee',
  'buttermilk',
  'chaas',
  'lassi',
  'cow',
  'buffalo',
  'cream',
  'skim',
  'toned',
  'double toned',
  'pasteurized',
  'wholesome',
];

const blockedKeywords = [
  'shoe',
  'sneaker',
  'boot',
  'heel',
  'sandals',
  'loafer',
  'formal',
  'grocery',
  'vegetable',
  'vegetables',
  'fruit',
  'fruits',
  'banana',
  'tomato',
  'carrot',
  'bread',
  'handwash',
  'cleaner',
  'floor',
  'shelf',
  'people',
  'person',
  'lifestyle',
  'market',
  'marketplace',
  'fashion',
];

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function isDairyImageUrl(url) {
  const normalized = normalizeText(url);
  if (!normalized) return false;

  const blocked = blockedKeywords.some((keyword) => normalized.includes(keyword));
  const approved = dairyKeywords.some((keyword) => normalized.includes(keyword));

  return approved && !blocked;
}

// Images uploaded by an admin (via Cloudinary) are always trusted and shown
// as-is, even though their URLs don't contain dairy keywords.
function isUploadedImageUrl(url) {
  const normalized = normalizeText(url);
  return normalized.includes('res.cloudinary.com') || normalized.includes('/image/upload/');
}

// A URL we should display directly rather than replace with a stock fallback.
function isTrustedImageUrl(url) {
  return isUploadedImageUrl(url) || isDairyImageUrl(url) || normalizeText(url).startsWith('/assets/dairy/');
}

function resolveDairyUrl(url, fallback = dairyAssets.genericSection) {
  if (!url) return fallback;
  return isTrustedImageUrl(url) ? url : fallback;
}

function resolveProductImage(product, index = 0) {
  const candidate = product?.images?.[index];
  if (candidate && isTrustedImageUrl(candidate)) {
    return candidate;
  }

  const name = normalizeText(product?.name);
  const category = normalizeText(product?.category?.name || product?.categoryName);
  const subject = `${name} ${category}`;

  // Check specific products before the generic "cow"/"milk" so e.g. "Pure Cow
  // Ghee" resolves to ghee (not milk) and "Toned Milk" gets its own image.
  if (subject.includes('buffalo')) return dairyAssets.productBuffaloMilk;
  if (subject.includes('ghee')) return dairyAssets.productGhee;
  if (subject.includes('curd') || subject.includes('dahi')) return dairyAssets.productCurd;
  if (subject.includes('paneer')) return dairyAssets.productPaneer;
  if (subject.includes('buttermilk') || subject.includes('chaas') || subject.includes('lassi')) return dairyAssets.productButtermilk;
  if (subject.includes('toned')) return dairyAssets.productTonedMilk;
  if (subject.includes('cow')) return dairyAssets.productCowMilk;
  if (subject.includes('milk')) return dairyAssets.productCowMilk;

  return dairyAssets.genericProduct;
}

function resolveCategoryImage(category) {
  // Prefer an admin-uploaded image when present.
  if (category && typeof category === 'object' && isTrustedImageUrl(category.image)) {
    return category.image;
  }

  const categoryName = normalizeText(category?.name || category?.categoryName || category);

  if (categoryName.includes('milk') || categoryName.includes('dairy')) return dairyAssets.productCowMilk;
  if (categoryName.includes('buffalo')) return dairyAssets.productBuffaloMilk;
  if (categoryName.includes('curd')) return dairyAssets.productCurd;
  if (categoryName.includes('paneer')) return dairyAssets.productPaneer;
  if (categoryName.includes('ghee')) return dairyAssets.productGhee;
  if (categoryName.includes('buttermilk') || categoryName.includes('chaas')) return dairyAssets.productButtermilk;

  return dairyAssets.genericCategory;
}

function resolveSectionImage(key) {
  switch (key) {
    case 'hero':
      return dairyAssets.heroMilk;
    case 'visit':
      return dairyAssets.visitCenter;
    case 'testimonial-family':
      return dairyAssets.testimonialFamily;
    case 'testimonial-delivery':
      return dairyAssets.testimonialDelivery;
    case 'loading':
      return dairyAssets.genericSection;
    default:
      return dairyAssets.genericSection;
  }
}

module.exports = {
  dairyAssets,
  isDairyImageUrl,
  resolveCategoryImage,
  resolveDairyUrl,
  resolveProductImage,
  resolveSectionImage,
};