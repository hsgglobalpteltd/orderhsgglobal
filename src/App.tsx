import * as React from "react";
import { 
  Search, 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Printer, 
  AlertCircle, 
  Trash2, 
  ClipboardList, 
  CheckCircle2, 
  MessageSquare,
  Image as ImageIcon
} from "lucide-react";
import { ChatAssist } from "./ChatAssist";

interface ProductMeta {
  Title: string;
  Short_Title: string;
  Short_Des: string;
  Long_Des: string;
  Category: string;
  Images: string[];
}

interface Product {
  sku: string;
  display_name: string;
  brands_id: string;
  image: string;
  carton: string;
  cost: string;
  status: string;
  single_barcode?: string;
  carton_barcode?: string;
  carton_weight?: string;
  carton_l_mm?: string | number | null;
  carton_w_mm?: string | number | null;
  carton_h_mm?: string | number | null;
  pallet_ctn?: string | number | null;
  storage_condition?: string | null;
  shelf_life?: string | null;
  product_meta: string | ProductMeta;
  list_in_catalog: boolean;
}

interface Brand {
  id: string;
  display_name: string;
  logo_image?: string;
}

interface CartItem {
  product: Product;
  quantity: number; // in Cartons
  mode: "order" | "quote";
}

export interface B2BSpecs {
  eaUnit: string;
  eaBarcode: string;
  ctnQty: number;
  ctnPacking: string;
  ctnBarcode: string;
  pltConfig: string;
  pltTotalCtn: number;
  palletDisplay: string;
  storageTier: string;
  shelfLife: string;
  localMoq: string;
  exportMoq: string;
  certifications: string[];
}

export function getProductB2BSpecs(product: Product, meta: ProductMeta): B2BSpecs {
  const name = `${product.display_name} ${meta.Title || ""}`;
  
  // 1. Extract Unit Size (EA)
  let eaUnit = "-";
  const sizeMatch = name.match(/(\d+(?:\.\d+)?\s*(?:KG|G|GM|L|LTR|ML))/i);
  if (sizeMatch) {
    eaUnit = sizeMatch[1].toUpperCase();
  }

  // 2. Carton Packing (CTN) - From DB `carton`
  const rawCarton = String(product.carton || "").trim();
  const ctnPacking = rawCarton ? `${rawCarton} EA / CTN` : "-";
  const ctnQty = parseInt(rawCarton) || 0;

  // 3. Pallet (PLT) Config - From DB `pallet_ctn` (No simulated fallback)
  const rawPallet = String(product.pallet_ctn || "").trim();
  const palletDisplay = rawPallet ? `${rawPallet} CTN` : "-";
  const pltTotalCtn = parseInt(rawPallet) || 0;
  const pltConfig = rawPallet ? `${rawPallet} CTN / PLT` : "-";

  // 4. Storage Condition - From DB `storage_condition` (No simulated fallback)
  const storageTier = product.storage_condition ? String(product.storage_condition).trim() : "-";

  // 5. Shelf Life - From DB `shelf_life` (No simulated fallback)
  const shelfLife = product.shelf_life ? String(product.shelf_life).trim() : "-";

  return {
    eaUnit,
    eaBarcode: product.single_barcode || "-",
    ctnQty,
    ctnPacking,
    ctnBarcode: product.carton_barcode || "-",
    pltConfig,
    pltTotalCtn,
    palletDisplay,
    storageTier,
    shelfLife,
    localMoq: "Min 4 Cartons (Registered SG Store Delivery)",
    exportMoq: "1 Full Pallet (PLT) / LCL / FCL Container Load",
    certifications: ["Halal Certified", "HACCP Food Safety", "Distributed by HSG Global"]
  };
}

// Helper to get optimized thumbnail image URL (fast loading)
export function getThumbnailUrl(url?: string): string {
  if (!url) return "https://images.unsplash.com/photo-1547592180-85f173990554?w=350&auto=format&fit=crop&q=70";
  
  // Imgur URLs (use 'm' suffix for medium 320x320 thumbnail)
  if (url.includes("i.imgur.com/")) {
    const match = url.match(/^https:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)$/);
    if (match) {
      const id = match[1];
      const ext = match[2];
      if (!/[sbtmlh]$/i.test(id)) {
        return `https://i.imgur.com/${id}m${ext}`;
      }
    }
  }

  // Unsplash URLs
  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", "350");
      u.searchParams.set("q", "75");
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {}
  }

  return url;
}

// Helper to get full resolution image URL
export function getFullImageUrl(url?: string): string {
  if (!url) return "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=85";

  // Imgur URLs: revert thumbnail suffix if any to load original full image
  if (url.includes("i.imgur.com/")) {
    const match = url.match(/^https:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)([sbtmlh])(\.[a-zA-Z0-9]+)$/i);
    if (match) {
      return `https://i.imgur.com/${match[1]}${match[3]}`;
    }
  }

  // Unsplash URLs: set higher resolution
  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", "1200");
      u.searchParams.set("q", "85");
      u.searchParams.set("auto", "format");
      return u.toString();
    } catch {}
  }

  return url;
}

// Smooth Green Light 1:1 Aspect Ratio Fallback for missing/broken images
function ImageFallback({
  alt,
  className,
  size = "md"
}: {
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={`aspect-square w-full h-full bg-[#F0FDF4] border border-[#DCFCE7] flex flex-col items-center justify-center text-center p-2 select-none ${className || ""}`}
    >
      <div className={`${size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8"} rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#1B4D2E] mb-1 shrink-0`}>
        <ImageIcon className={`${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4"} opacity-80`} />
      </div>
      {alt && size !== "sm" && (
        <span className="text-[10px] font-semibold text-[#1B4D2E] line-clamp-2 px-1 opacity-70 leading-tight">
          {alt}
        </span>
      )}
    </div>
  );
}

// Product Card Image Component for Catalog Grid with Fallback
function ProductCardImage({
  src,
  alt,
  className
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(!src);
  const thumbUrl = React.useMemo(() => getThumbnailUrl(src), [src]);

  React.useEffect(() => {
    setHasError(!src);
  }, [src]);

  if (hasError || !src) {
    return <ImageFallback alt={alt} className={className} />;
  }

  return (
    <img
      src={thumbUrl}
      alt={alt}
      className={className || "product-card-img"}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}

// Progressive Image Loader for Detail Modal with Fallback
function ProgressiveProductImage({
  src,
  alt,
  className
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const thumbUrl = React.useMemo(() => getThumbnailUrl(src), [src]);
  const fullUrl = React.useMemo(() => getFullImageUrl(src), [src]);
  const [currentSrc, setCurrentSrc] = React.useState(thumbUrl);
  const [hasError, setHasError] = React.useState(!src);

  React.useEffect(() => {
    setHasError(!src);
    setCurrentSrc(thumbUrl);
    if (!fullUrl || fullUrl === thumbUrl || !src) return;

    const img = new Image();
    img.src = fullUrl;
    img.onload = () => {
      setCurrentSrc(fullUrl);
    };
    img.onerror = () => {
      if (!thumbUrl) setHasError(true);
    };
  }, [src, thumbUrl, fullUrl]);

  if (hasError || !src) {
    return <ImageFallback alt={alt} className={className} size="lg" />;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className || "modal-main-img"}
      loading="eager"
      onError={() => setHasError(true)}
    />
  );
}

// Gallery Thumbnail with Fallback
function GalleryThumbnail({
  src,
  alt,
  isActive,
  onClick
}: {
  src: string;
  alt: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hasError, setHasError] = React.useState(!src);

  React.useEffect(() => {
    setHasError(!src);
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`modal-thumbnail-btn ${isActive ? "active" : ""}`}
      title={alt}
    >
      {hasError || !src ? (
        <div className="w-full h-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#1B4D2E] rounded">
          <ImageIcon className="w-3.5 h-3.5 opacity-70" />
        </div>
      ) : (
        <img
          src={getThumbnailUrl(src)}
          alt={alt}
          className="modal-thumbnail-img"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      )}
    </button>
  );
}

const BACKEND_URL = "https://ib-v2.hsgglobalpteltd.workers.dev";

export default function App() {
  // Navigation & View states
  const [orderIdParam, setOrderIdParam] = React.useState<string | null>(null);
  const [quoteIdParam, setQuoteIdParam] = React.useState<string | null>(null);
  const [thankYouData, setThankYouData] = React.useState<{ id: string; type: string; receiver_order_whatsapp: string; summaryText: string } | null>(null);
  
  // Data states
  const [products, setProducts] = React.useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("hsg_catalog_products");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [brands, setBrands] = React.useState<Brand[]>(() => {
    try {
      const cached = localStorage.getItem("hsg_catalog_brands");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = React.useState(() => {
    try {
      return !localStorage.getItem("hsg_catalog_products");
    } catch {
      return true;
    }
  });
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeBrandId, setActiveBrandId] = React.useState<string>("all");
  const [activeCategoryId, setActiveCategoryId] = React.useState<string>("Cooking Paste");
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);

  // Retailer Verification states with localStorage persistence
  const [verifiedRetailer, setVerifiedRetailer] = React.useState<any | null>(() => {
    try {
      const saved = localStorage.getItem("hsg_verified_retailer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.retailer || null;
      }
    } catch {}
    return null;
  });
  const [retailerStores, setRetailerStores] = React.useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("hsg_verified_retailer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.stores || [];
      }
    } catch {}
    return [];
  });
  const [retailerSkus, setRetailerSkus] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("hsg_verified_retailer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.skus || [];
      }
    } catch {}
    return [];
  });
  const [retailerInput, setRetailerInput] = React.useState(() => {
    try {
      const saved = localStorage.getItem("hsg_verified_retailer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.retailerInput || "";
      }
    } catch {}
    return "";
  });
  const [verifying, setVerifying] = React.useState(false);

  // Cart states
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = React.useState(false);

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [detailQty, setDetailQty] = React.useState(1);

  // Checkout states
  const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);
  const [selectedStoreId, setSelectedStoreId] = React.useState("");
  // New Customer info
  const [custName, setCustName] = React.useState("");
  const [custPhone, setCustPhone] = React.useState("");
  const [custEmail, setCustEmail] = React.useState("");
  const [custAddress, setCustAddress] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitType, setSubmitType] = React.useState<"order" | "quote">("order");


  // Tracking page state
  const [trackingRecord, setTrackingRecord] = React.useState<any | null>(null);
  const [trackingType, setTrackingType] = React.useState<"order" | "quote" | null>(null);
  const [trackingLoading, setTrackingLoading] = React.useState(false);

  // Extract query parameters on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oId = params.get("orderId");
    const qId = params.get("quoteId");
    const rId = params.get("retailerId");
    if (oId) setOrderIdParam(oId);
    if (qId) setQuoteIdParam(qId);
    if (rId) {
      const autoVerify = async () => {
        setVerifying(true);
        try {
          const res = await fetch(`${BACKEND_URL}/api/public/retailer?id=${encodeURIComponent(rId.trim())}`);
          if (!res.ok) throw new Error("Network response error");
          const data = await res.json();
          if (data.found) {
            setVerifiedRetailer(data.retailer);
            setRetailerStores(data.stores || []);
            setRetailerSkus(data.skus || []);
            setSelectedStoreId("");
            setRetailerInput(rId.trim());
            try {
              localStorage.setItem(
                "hsg_verified_retailer_session",
                JSON.stringify({
                  retailer: data.retailer,
                  stores: data.stores || [],
                  skus: data.skus || [],
                  retailerInput: rId.trim()
                })
              );
            } catch {}
          }
        } catch (err) {
          console.error("Auto verification failed:", err);
        } finally {
          setVerifying(false);
        }
      };
      autoVerify();
    }
  }, []);

  // Sync contact details when verifiedRetailer changes
  React.useEffect(() => {
    if (verifiedRetailer) {
      setCustName(verifiedRetailer.display_name || "");
      setCustEmail(verifiedRetailer.email || "");
    } else {
      setCustName("");
      setCustEmail("");
      setCustPhone("");
    }
  }, [verifiedRetailer]);

  // Fetch Catalog data
  const fetchCatalog = React.useCallback(async () => {
    let hasCached = false;
    try {
      hasCached = !!localStorage.getItem("hsg_catalog_products");
    } catch {}
    
    if (!hasCached) {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/catalog`);
      if (!res.ok) throw new Error("Failed to load catalog data");
      const data = await res.json();
      const newProducts = data.products || [];
      const newBrands = data.brands || [];
      
      setProducts(newProducts);
      setBrands(newBrands);
      
      try {
        localStorage.setItem("hsg_catalog_products", JSON.stringify(newProducts));
        localStorage.setItem("hsg_catalog_brands", JSON.stringify(newBrands));
      } catch (e) {
        console.warn("Failed to save catalog cache in localStorage:", e);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Tracking record if active
  const fetchTracking = React.useCallback(async (id: string) => {
    setTrackingLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/order/status?id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to retrieve tracking details");
      const data = await res.json();
      if (data.found) {
        setTrackingRecord(data.record);
        setTrackingType(data.type);
      } else {
        setTrackingRecord(null);
        setTrackingType(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (orderIdParam) {
      fetchTracking(orderIdParam);
    } else if (quoteIdParam) {
      fetchTracking(quoteIdParam);
    } else {
      fetchCatalog();
    }

    // Auto-refresh verified buyer session data in the background
    try {
      const saved = localStorage.getItem("hsg_verified_retailer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        const rId = parsed.retailer?.id || parsed.retailerInput;
        if (rId) {
          fetch(`${BACKEND_URL}/api/public/retailer?id=${encodeURIComponent(rId)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.found && data.retailer) {
                setVerifiedRetailer(data.retailer);
                setRetailerStores(data.stores || []);
                setRetailerSkus(data.skus || []);
                localStorage.setItem(
                  "hsg_verified_retailer_session",
                  JSON.stringify({
                    retailer: data.retailer,
                    stores: data.stores || [],
                    skus: data.skus || [],
                    retailerInput: rId
                  })
                );
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, [orderIdParam, quoteIdParam, fetchCatalog, fetchTracking]);

  // Handle Retailer ID verification
  const handleVerifyRetailer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!retailerInput.trim()) return;

    setVerifying(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/retailer?id=${encodeURIComponent(retailerInput.trim())}`);
      if (!res.ok) throw new Error("Network response error");
      const data = await res.json();
      
      if (data.found) {
        setVerifiedRetailer(data.retailer);
        setRetailerStores(data.stores || []);
        setRetailerSkus(data.skus || []);
        setSelectedStoreId("");
        try {
          localStorage.setItem(
            "hsg_verified_retailer_session",
            JSON.stringify({
              retailer: data.retailer,
              stores: data.stores || [],
              skus: data.skus || [],
              retailerInput: retailerInput.trim()
            })
          );
        } catch {}
        showToast("Buyer verified successfully!", "success");
      } else {
        setVerifiedRetailer(null);
        setRetailerStores([]);
        setRetailerSkus([]);
        try {
          localStorage.removeItem("hsg_verified_retailer_session");
        } catch {}
        showToast("Invalid Buyer ID. Please try again.", "error");
      }
    } catch {
      showToast("Verification failed. Please try again.", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleClearRetailer = () => {
    setVerifiedRetailer(null);
    setRetailerStores([]);
    setRetailerSkus([]);
    setRetailerInput("");
    setSelectedStoreId("");
    setIsCartOpen(false);
    setCart((prev) => prev.filter((item) => item.mode !== "order"));
    try {
      localStorage.removeItem("hsg_verified_retailer_session");
    } catch {}
  };

  // Add product to cart helper
  const handleAddToCart = (product: Product, qty: number = 1, mode: "order" | "quote" = "order", e?: React.MouseEvent) => {
    if (mode === "quote") {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.sku === product.sku && item.mode === "quote");
        if (existing) {
          showToast("Item is already in your Quote list", "info");
          return prev;
        }
        showToast("Added to Price Quote Inquiries", "success");
        return [...prev, { product, quantity: 1, mode: "quote" }];
      });
      if (e) animateFlyToCart(e, "quote");
      return;
    }

    const parsedQty = Number(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.sku === product.sku && item.mode === "order");
      if (existing) {
        return prev.map((item) =>
          item.product.sku === product.sku && item.mode === "order" ? { ...item, quantity: item.quantity + parsedQty } : item
        );
      }
      return [...prev, { product, quantity: parsedQty, mode: "order" }];
    });
    if (e) animateFlyToCart(e, "order");
    showToast(`Added ${parsedQty} carton(s) to order cart`, "success");
  };

  const updateCartQty = (sku: string, mode: "order" | "quote", newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => !(item.product.sku === sku && item.mode === mode)));
    } else {
      setCart((prev) => prev.map((item) => item.product.sku === sku && item.mode === mode ? { ...item, quantity: newQty } : item));
    }
  };

  const formatCarton = (c: string) => {
    if (!c) return "12 Pcs";
    const cleaned = c.replace(/pcs/i, "Pcs");
    if (/^\d+$/.test(cleaned.trim())) {
      return `${cleaned.trim()} Pcs`;
    }
    return cleaned;
  };

  const parseProductMeta = (product: Product): ProductMeta => {
    if (typeof product.product_meta === "string") {
      try {
        return JSON.parse(product.product_meta);
      } catch {
        // return default structure
      }
    } else if (product.product_meta && typeof product.product_meta === "object") {
      return product.product_meta as ProductMeta;
    }

    return {
      Title: product.display_name,
      Short_Title: product.display_name,
      Short_Des: `${product.display_name} - Premium quality product.`,
      Long_Des: `Enjoy the authentic taste of ${product.display_name}. Freshly processed, premium ingredients, and manufactured under strict hygiene standards.`,
      Category: "Product",
      Images: [product.image || "https://images.unsplash.com/photo-1547592180-85f173990554?w=600"]
    };
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setCarouselIndex(0);
    setDetailQty(1);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const currentSubmitType = verifiedRetailer ? submitType : "quote";
    if (currentSubmitType === "order") {
      const totalOrderCartons = cart.filter((item) => item.mode === "order").reduce((a, b) => a + b.quantity, 0);
      if (totalOrderCartons < 4) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        type: currentSubmitType,
        items: cart.map((item) => ({
          sku: item.product.sku,
          carton_qty: item.quantity
        }))
      };

      if (verifiedRetailer) {
        payload.retailer_id = verifiedRetailer.id;
        
        let retailerNameDisplay = verifiedRetailer.display_name || "Retailer";
        if (selectedStoreId && currentSubmitType === "order") {
          // Append Store ID in parentheses next to name
          retailerNameDisplay = `${retailerNameDisplay} (${selectedStoreId})`;
        }
        payload.retailer_name = retailerNameDisplay;
        
        if (currentSubmitType === "quote") {
          if (!custPhone.trim() || !custEmail.trim()) {
            showToast("Please fill in contact phone and email", "warning");
            setSubmitting(false);
            return;
          }
          payload.customer_name = custName.trim() || verifiedRetailer.display_name;
          payload.customer_phone = custPhone.trim();
          payload.customer_email = custEmail.trim();

          payload.store_id = null;
          payload.address = verifiedRetailer.address || "";
          payload.postcode = verifiedRetailer.postcode || "";
          payload.pin_location = verifiedRetailer.pin_location || "";
        } else {
          // For orders: email is mandatory
          if (!custEmail.trim()) {
            showToast("Please fill in your email address", "warning");
            setSubmitting(false);
            return;
          }
          payload.customer_email = custEmail.trim();
          payload.customer_name = verifiedRetailer.display_name || "";

          // Find store details
          const selectedStore = retailerStores.find((s) => s.id === selectedStoreId);
          if (selectedStore) {
            payload.store_id = selectedStore.id;
            payload.address = selectedStore.address;
            payload.postcode = selectedStore.postcode || "";
            payload.pin_location = selectedStore.pin_locations || "";
          } else {
            payload.store_id = null;
            payload.address = verifiedRetailer.address || "";
            payload.postcode = verifiedRetailer.postcode || "";
            payload.pin_location = verifiedRetailer.pin_location || "";
          }
        }
      } else {
        if (!custName.trim() || !custPhone.trim() || !custEmail.trim()) {
          showToast("Please fill in name, phone, and email", "warning");
          setSubmitting(false);
          return;
        }
        payload.customer_name = custName.trim();
        payload.customer_phone = custPhone.trim();
        payload.customer_email = custEmail.trim();
        payload.address = custAddress.trim();
        payload.postcode = "";
      }

      const res = await fetch(`${BACKEND_URL}/api/public/order/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Order submission failed");
      const result = await res.json();
      
      if (result.success && result.id) {
        showToast("Checkout successful!", "success");
        // Update local state email
        if (verifiedRetailer && custEmail.trim()) {
          setVerifiedRetailer((prev: any) => (prev ? { ...prev, email: custEmail.trim() } : null));
        }
        setCart([]);
        setIsCartOpen(false);
        setShowCheckoutModal(false);

        // Generate WhatsApp redirection URL containing order summary and tracking link
        const currentDomain = window.location.origin;
        const isOrder = result.id.startsWith("DO-") || result.id.startsWith("PO-");
        const trackingLink = isOrder
          ? `${currentDomain}/?orderId=${result.id}`
          : `${currentDomain}/?quoteId=${result.id}`;

        let summaryText = "";
        if (isOrder) {
          summaryText += `New Order\n`;
          summaryText += `Order Ref : ${result.id}\n`;
          summaryText += `Deliver to: ${payload.retailer_name}\n`;
          summaryText += `${payload.address}\n`;
          summaryText += `Order Details \n`;
          summaryText += `${trackingLink}`;
        } else {
          summaryText += `New Quotation\n`;
          summaryText += `Order Ref : ${result.id}\n`;
          if (verifiedRetailer) {
            summaryText += `Deliver to: ${payload.retailer_name}\n`;
            summaryText += `${payload.address}\n`;
          } else {
            summaryText += `Deliver to: ${payload.customer_name}\n`;
            summaryText += `${payload.address}\n`;
          }
          summaryText += `Order Details \n`;
          summaryText += `${trackingLink}`;
        }

        setThankYouData({
          id: result.id,
          type: isOrder ? "order" : "quote",
          receiver_order_whatsapp: result.receiver_order_whatsapp,
          summaryText
        });
      }
    } catch {
      showToast("Checkout failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper toast notification
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fly-to-cart orange dot animation helper
  const animateFlyToCart = (e: React.MouseEvent, mode: "order" | "quote") => {
    const btn = e.currentTarget as HTMLElement;
    if (!btn) return;

    const targetId = mode === "order" ? "cart-btn-header" : "quote-btn-header";
    const targetBtn = document.getElementById(targetId);
    if (!targetBtn) return;

    const btnRect = btn.getBoundingClientRect();
    const targetRect = targetBtn.getBoundingClientRect();
    const btnStyles = window.getComputedStyle(btn);

    // Create a solid orange block matching the button's dimensions and shape (no text inside)
    const clone = document.createElement("div");
    clone.className = "flying-cart-button";
    
    // Lock dimensions, shape, background color, and set starting coordinates
    clone.style.position = "fixed";
    clone.style.left = `${btnRect.left}px`;
    clone.style.top = `${btnRect.top}px`;
    clone.style.width = `${btnRect.width}px`;
    clone.style.height = `${btnRect.height}px`;
    clone.style.borderRadius = btnStyles.borderRadius || "4px";
    clone.style.backgroundColor = "#1B4D2E"; // Solid primary forest green color
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    clone.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease";
    clone.style.transformOrigin = "center";
    
    document.body.appendChild(clone);

    // Target coordinates (center of the cart/quote button in header)
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    
    // Calculate the translation offsets relative to clone's center
    const startCenterX = btnRect.left + btnRect.width / 2;
    const startCenterY = btnRect.top + btnRect.height / 2;

    const transX = endX - startCenterX;
    const transY = endY - startCenterY;

    // Force reflow
    void clone.offsetHeight;

    // Translate and scale down the solid orange block
    clone.style.transform = `translate(${transX}px, ${transY}px) scale(0.1)`;
    clone.style.opacity = "0";

    setTimeout(() => {
      clone.remove();
      targetBtn.classList.add("cart-bounce");
      setTimeout(() => {
        targetBtn.classList.remove("cart-bounce");
      }, 300);
    }, 600);
  };


  // Extract unique categories from products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const meta = parseProductMeta(p);
      if (meta.Category) {
        set.add(meta.Category);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter brands based on selected category
  const filteredBrands = React.useMemo(() => {
    if (activeCategoryId === "all") return brands;
    const activeBrandIds = new Set(
      products
        .filter((p) => parseProductMeta(p).Category === activeCategoryId)
        .map((p) => p.brands_id)
    );
    return brands.filter((b) => activeBrandIds.has(b.id));
  }, [brands, products, activeCategoryId]);

  // Reset active brand if it's no longer present in the category
  React.useEffect(() => {
    if (activeBrandId !== "all") {
      const isValid = filteredBrands.some((b) => b.id === activeBrandId);
      if (!isValid) {
        setActiveBrandId("all");
      }
    }
  }, [activeCategoryId, filteredBrands, activeBrandId]);

  // Filter products by category, search, and brand
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const meta = parseProductMeta(p);
      // 1. Category selection filter
      if (activeCategoryId !== "all" && meta.Category !== activeCategoryId) {
        return false;
      }
      // 2. Brand selection filter
      if (activeBrandId !== "all" && p.brands_id !== activeBrandId) {
        return false;
      }
      // 3. Retailer SKUs catalog filter (if active)
      if (verifiedRetailer && retailerSkus.length > 0 && !retailerSkus.includes(p.sku)) {
        return false;
      }
      // 4. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (meta.Title || "").toLowerCase().includes(query) || (meta.Short_Title || "").toLowerCase().includes(query);
        const matchSku = p.sku.toLowerCase().includes(query);
        const matchBrand = (brands.find((b) => b.id === p.brands_id)?.display_name || "").toLowerCase().includes(query);
        return matchTitle || matchSku || matchBrand;
      }
      return true;
    });
  }, [products, activeCategoryId, activeBrandId, searchQuery, verifiedRetailer, retailerSkus, brands]);

  // Group filtered products by brand
  const groupedProducts = React.useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.brands_id]) {
        groups[p.brands_id] = [];
      }
      groups[p.brands_id].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // RENDER: Tracking View Page
  if (orderIdParam || quoteIdParam) {
    if (trackingLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-zinc-600">Loading Order Summary...</p>
          </div>
        </div>
      );
    }

    if (!trackingRecord) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
          <div className="bg-white p-6 border border-zinc-200 rounded-lg text-center max-w-md w-full flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-zinc-400" />
            <h2 className="text-lg font-bold text-zinc-800">Order/Quote Not Found</h2>
            <p className="text-sm text-zinc-500">The reference ID provided does not exist or has expired.</p>
            <button
              onClick={() => {
                window.location.href = window.location.origin;
              }}
              className="mt-2 px-4 py-2 bg-[#1B4D2E] text-white rounded font-semibold text-sm hover:bg-[#143C23]"
            >
              Go back to Catalog
            </button>
          </div>
        </div>
      );
    }

    const rec = trackingRecord;
    const isCompleted = rec.status === "complete";
    const dateStr = rec.created_at ? new Date(Number(rec.created_at)).toLocaleDateString("en-GB") : "-";
    
    let parsedItems: any[] = [];
    try {
      parsedItems = typeof rec.items === "string" ? JSON.parse(rec.items) : (rec.items || []);
    } catch {}

    return (
      <div className="min-h-screen bg-zinc-100 py-6 px-4">
        <div className="tracking-wrapper">
          <div className="tracking-header" style={{ backgroundColor: "#1B4D2E" }}>
            <div className="flex items-center justify-center gap-2">
              <img src="/hsg_logo.png" alt="HSG Global" className="h-5 w-5 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <h2 className="text-xl font-bold text-white tracking-wide">HSG GLOBAL</h2>
            </div>
            <p className="text-xs text-emerald-100 mt-1">B2B Order Tracking & Commercial Summary</p>
          </div>

          <div className="tracking-body">
            <div className={`tracking-status-bar ${isCompleted ? "completed" : ""}`}>
              <span>STATUS:</span>
              <span className="text-sm uppercase">{(rec.status || "PENDING").toUpperCase()}</span>
            </div>

            <div className="tracking-info-grid">
              <div className="tracking-info-item">
                <span>Reference ID</span>
                <span className="font-mono font-bold text-zinc-900">{rec.id}</span>
              </div>
              <div className="tracking-info-item">
                <span>Date Placed</span>
                <span>{dateStr}</span>
              </div>
              
              {trackingType === "order" ? (
                <>
                  <div className="tracking-info-item">
                    <span>Buyer Name</span>
                    <span className="font-semibold">{rec.retailer_name}</span>
                  </div>
                  <div className="tracking-info-item">
                    <span>Buyer ID</span>
                    <span className="font-mono">{rec.retailer_id}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="tracking-info-item">
                    <span>Customer Name</span>
                    <span>{rec.customer_name}</span>
                  </div>
                  <div className="tracking-info-item">
                    <span>Contact Phone</span>
                    <span>{rec.customer_phone}</span>
                  </div>
                </>
              )}

              <div className="tracking-info-item col-span-2">
                <span>Delivery Address</span>
                <span>{rec.address} ({rec.postcode})</span>
              </div>

              {isCompleted && (
                <>
                  <div className="tracking-info-item">
                    <span>Invoice Number</span>
                    <span className="font-semibold text-zinc-900">{rec.invoice_number}</span>
                  </div>
                  <div className="tracking-info-item">
                    <span>Invoice Amount</span>
                    <span className="font-bold text-zinc-900">${Number(rec.invoice_amount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="tracking-items-list">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Itemised Packaging & Order List</h4>
              {parsedItems.map((item, idx) => {
                // Find local details
                const prod = products.find((p) => p.sku === item.sku);
                const title = prod ? parseProductMeta(prod).Short_Title : item.sku;
                return (
                  <div key={idx} className="tracking-item-row">
                    <span className="tracking-item-name">{title}</span>
                    <span className="tracking-item-qty">{item.carton_qty || item.qty} Carton(s)</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => window.print()}
              className="btn-print-summary"
            >
              <Printer className="w-4 h-4" /> Print Commercial Slip
            </button>

            <button
              onClick={() => {
                window.location.href = window.location.origin;
              }}
              className="btn-print-summary bg-zinc-600 hover:bg-zinc-700 mt-2 text-white"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Thank You View Page
  if (thankYouData) {
    return (
      <ThankYouPage 
        data={thankYouData} 
        onClose={() => setThankYouData(null)} 
      />
    );
  }

  // RENDER: Catalog View
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 pb-36">
      
      {/* Search Header */}
      <header>
        <div className="header-container">
          <a
            onClick={() => {
              setActiveBrandId("all");
              setActiveCategoryId("all");
            }}
            className={`brand-title ${showMobileSearch ? "mobile-hidden" : ""}`}
            title="HSG Global Pte. Ltd."
          >
            <img 
              src="/hsg_logo.png" 
              alt="HSG Global Logo" 
              className="h-[1.25rem] w-[1.25rem] object-contain shrink-0" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-emerald-950 font-black tracking-tight leading-none">HSG GLOBAL</span>
          </a>
          
          {/* Desktop search wrapper */}
          <div className="search-input-wrapper desktop-only">
            <input
              type="text"
              placeholder="Search products, brands, paste types, beverage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="search-icon w-4 h-4" />
          </div>

          {/* Mobile search wrapper (grows slowly and covers logo/title space) */}
          <div className={`mobile-search-wrapper mobile-only ${showMobileSearch ? "active" : ""}`}>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="mobile-search-input"
            />
            <button
              onClick={() => {
                setSearchQuery("");
                setShowMobileSearch(false);
              }}
              className="mobile-search-clear-btn"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="header-actions">
            {/* Mobile search toggle */}
            {!showMobileSearch && (
              <button
                onClick={() => {
                  setShowMobileSearch(true);
                  setTimeout(() => {
                    document.getElementById("mobile-search-input")?.focus();
                  }, 100);
                }}
                className="search-toggle-btn mobile-only"
                title="Search"
                style={{ color: "#1B4D2E" }}
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {verifiedRetailer && (
              <button 
                id="cart-btn-header" 
                onClick={() => { setIsCartOpen(true); setIsQuoteOpen(false); }} 
                className="cart-icon-btn" 
                title="Direct Carton Order List"
              >
                <ShoppingCart className="w-5 h-5 text-emerald-900" />
                {cart.filter(item => item.mode === "order").length > 0 && (
                  <span className="cart-badge">
                    {cart.filter(item => item.mode === "order").reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            )}

            <button 
              id="quote-btn-header" 
              onClick={() => { setIsQuoteOpen(true); setIsCartOpen(false); }} 
              className={`cart-icon-btn ${verifiedRetailer ? "ml-2" : ""}`} 
              title="Pallet & Container Quote List"
            >
              <ClipboardList className="w-5 h-5 text-emerald-900" />
              {cart.filter(item => item.mode === "quote").length > 0 && (
                <span className="cart-badge">
                  {cart.filter(item => item.mode === "quote").reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Subheader: Retailer Verification Panel */}
      <div className="verification-panel">
        <div className="verification-container justify-center">
          {verifiedRetailer ? (
            <div className="flex flex-col sm:flex-row items-center justify-between w-full py-1 text-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-950">
                  Welcome, <strong className="text-emerald-800">{verifiedRetailer.name || verifiedRetailer.display_name}</strong>
                </span>
              </div>
              <button
                onClick={handleClearRetailer}
                className="btn-link text-emerald-700 hover:text-emerald-900 text-xs"
              >
                Not you? (Change Buyer ID)
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyRetailer} className="flex flex-col md:flex-row justify-center items-center w-full gap-3 py-1 flex-wrap">
              <div className="text-xs font-semibold text-zinc-700">
                Enter Buyer ID for direct ordering:
              </div>
              <div className="retailer-input-group justify-center">
                <input
                  type="text"
                  placeholder="eg: 30000000/A0001"
                  value={retailerInput}
                  onChange={(e) => setRetailerInput(e.target.value)}
                  disabled={verifying}
                />
                <button type="submit" disabled={verifying} className="btn-verify">
                  {verifying ? "Verifying..." : "Verify ID"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="main-wrapper">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Sticky Category Filter Tabs */}
        <div className="category-tabs-sticky-wrapper">
          <div className="brand-tabs-scroll tabs-scroll-center">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  if (activeCategoryId === c) {
                    setActiveCategoryId("all");
                  } else {
                    setActiveCategoryId(c);
                  }
                }}
                className={`brand-tab ${activeCategoryId === c ? "active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Lists loading block */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-2">
            <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 font-semibold">Loading HSG Global Catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-md p-6">
            <p className="text-sm text-zinc-500 italic">No products found matching your filter selections.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedProducts).map(([bId, list]) => {
              const brand = brands.find((b) => b.id === bId);
              return (
                <div key={bId} className="brand-group">
                  <h3 className="brand-group-header">
                    {brand?.display_name || "Unknown Brand"}
                  </h3>
                  <div className="products-grid">
                    {list.map((p) => {
                      const meta = parseProductMeta(p);
                      const specs = getProductB2BSpecs(p, meta);
                      return (
                        <div key={p.sku} className="product-card" onClick={() => handleOpenProduct(p)}>
                          <ProductCardImage
                            src={p.image}
                            alt={p.display_name}
                            className="product-card-img"
                          />
                          <div className="product-card-info">
                            <span className="product-card-title">{meta.Short_Title || p.display_name}</span>
                            
                            {/* Minimalist 2-Column Specs Layout (No Table) */}
                            <div className="product-card-specs-2col">
                              <div className="specs-2col-left">
                                <span className="specs-item">{specs.ctnPacking}</span>
                                {specs.storageTier !== "-" && (
                                  <span className="specs-item">{specs.storageTier}</span>
                                )}
                              </div>
                              <div className="specs-2col-right">
                                {specs.pltConfig !== "-" && (
                                  <span className="specs-item">{specs.pltConfig}</span>
                                )}
                                {specs.shelfLife !== "-" && (
                                  <span className="specs-item">{specs.shelfLife}</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: Preserving Registered Retailer Direct Order + Quote */}
                            <div className="flex flex-col gap-1 mt-2">
                              {verifiedRetailer ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(p, 1, "order", e);
                                    }}
                                    className="btn-card-add"
                                    style={{ backgroundColor: "#1B4D2E", color: "#ffffff", borderColor: "#1B4D2E" }}
                                  >
                                    Add to Order
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(p, 1, "quote", e);
                                    }}
                                    className="btn-card-quote text-xs py-1"
                                    style={{ borderColor: "#E2E8F0", color: "#64748B", fontSize: "11px" }}
                                  >
                                    Get Quote
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(p, 1, "quote", e);
                                  }}
                                  className="btn-card-quote"
                                  style={{ backgroundColor: "#1B4D2E", color: "#ffffff", borderColor: "#1B4D2E" }}
                                >
                                  Get Quote
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Terms and Conditions Footer - Stored in retailer_db, hidden if no data */}
        {(() => {
          if (!verifiedRetailer) return null;

          // Find terms from any variations of column names
          const rawTerms =
            verifiedRetailer.terms ||
            verifiedRetailer.Terms ||
            verifiedRetailer.terms_and_conditions ||
            verifiedRetailer["Terms & Conditions"] ||
            verifiedRetailer["Terms and Conditions"] ||
            verifiedRetailer.order_terms ||
            verifiedRetailer.Order_Terms ||
            verifiedRetailer.tc ||
            verifiedRetailer.TC ||
            verifiedRetailer.tnc ||
            verifiedRetailer.TNC ||
            verifiedRetailer.notes ||
            verifiedRetailer.Notes ||
            verifiedRetailer.remarks ||
            verifiedRetailer.Remarks ||
            "";

          if (typeof rawTerms !== "string" || !rawTerms.trim()) {
            return null; // Zero fallback - hide completely when no data
          }

          // Split by '/' or newline into separate bullet items
          const bullets = rawTerms
            .split(/[\/\n]+/)
            .map((b) => b.trim())
            .filter(Boolean);

          if (bullets.length === 0) return null;

          return (
            <footer className="tc-footer">
              <div className="tc-sticky-note">
                <h4>Buyer Order Terms & Conditions</h4>
                <ul>
                  {bullets.map((bullet, idx) => {
                    const colonIndex = bullet.indexOf(":");
                    if (colonIndex > 0 && colonIndex < 40) {
                      const label = bullet.substring(0, colonIndex + 1);
                      const value = bullet.substring(colonIndex + 1);
                      return (
                        <li key={idx}>
                          <strong>{label}</strong>{value}
                        </li>
                      );
                    }
                    return <li key={idx}>{bullet}</li>;
                  })}
                </ul>
              </div>
            </footer>
          );
        })()}

      </div>

      {/* 2-Column Product Detail Modal with Gallery, Scrollable Specs, & Sticky Bottom Button */}
      {selectedProduct && (() => {
        const meta = parseProductMeta(selectedProduct);
        const specs = getProductB2BSpecs(selectedProduct, meta);
        const imagesList = [
          selectedProduct.image,
          ...(Array.isArray(meta.Images) ? meta.Images : [])
        ].filter((img, idx, arr) => img && arr.indexOf(img) === idx);

        // Format carton dimensions
        const hasDim = selectedProduct.carton_l_mm || selectedProduct.carton_w_mm || selectedProduct.carton_h_mm;
        const cartonDims = hasDim 
          ? `${selectedProduct.carton_l_mm || "-"} × ${selectedProduct.carton_w_mm || "-"} × ${selectedProduct.carton_h_mm || "-"} mm`
          : "-";

        return (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="product-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedProduct(null)} className="modal-close-btn" title="Close">
                <X className="w-4 h-4" />
              </button>

              {/* Scrollable Modal Content */}
              <div className="product-modal-body-scroll">
                <div className="product-modal-2col">
                  {/* Left Column: Image Gallery */}
                  <div className="modal-gallery">
                    <div className="modal-main-img-wrap">
                      <ProgressiveProductImage
                        src={imagesList[carouselIndex] || selectedProduct.image}
                        alt={selectedProduct.display_name}
                        className="modal-main-img"
                      />
                    </div>

                    {/* Thumbnail Row (shown if more than 1 image) */}
                    {imagesList.length > 1 && (
                      <div className="modal-thumbnails-row">
                        {imagesList.map((img, i) => (
                          <GalleryThumbnail
                            key={i}
                            src={img}
                            alt={`Thumbnail ${i + 1}`}
                            isActive={carouselIndex === i}
                            onClick={() => setCarouselIndex(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Product Info & Complete B2B Specs */}
                  <div className="product-detail-body">
                    <div className="product-detail-header-row">
                      <span className="product-detail-brand">
                        {brands.find((b) => b.id === selectedProduct.brands_id)?.display_name || "HSG GLOBAL"}
                      </span>
                      <span className="product-detail-sku">
                        SKU: {selectedProduct.sku}
                      </span>
                    </div>
                    
                    <h3 className="product-detail-title">{meta.Title || selectedProduct.display_name}</h3>

                    {/* Minimalist Seamless Logistics & Packaging Specs */}
                    <div className="modal-specs-clean">
                      <div className="specs-clean-grid">
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Unit (EA)</span>
                          <span className="specs-clean-val">{specs.eaUnit}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Carton (CTN)</span>
                          <span className="specs-clean-val">{specs.ctnPacking}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Single EAN</span>
                          <span className="specs-clean-val font-mono text-[11px]">{selectedProduct.single_barcode || "-"}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Carton ITF</span>
                          <span className="specs-clean-val font-mono text-[11px]">{selectedProduct.carton_barcode || "-"}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Carton Size</span>
                          <span className="specs-clean-val">{cartonDims}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Carton Weight</span>
                          <span className="specs-clean-val">{selectedProduct.carton_weight ? `${selectedProduct.carton_weight} kg` : "-"}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Pallet (PLT)</span>
                          <span className="specs-clean-val">{specs.palletDisplay !== "-" ? `${specs.pltTotalCtn} CTN` : "-"}</span>
                        </div>
                        <div className="specs-clean-row">
                          <span className="specs-clean-key">Shelf Life</span>
                          <span className="specs-clean-val">{specs.shelfLife}</span>
                        </div>
                        <div className="specs-clean-row full-width">
                          <span className="specs-clean-key">Storage Condition</span>
                          <span className="specs-clean-val">{specs.storageTier}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {(meta.Long_Des || meta.Short_Des) && (
                      <p className="product-detail-desc">{meta.Long_Des || meta.Short_Des}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Action Footer */}
              <div className="product-modal-footer-sticky">
                {verifiedRetailer ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-700 text-xs">Quantity:</span>
                      <div className="qty-counter">
                        <button
                          onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                          className="qty-btn"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="qty-value">{detailQty}</span>
                        <button
                          onClick={() => setDetailQty(detailQty + 1)}
                          className="qty-btn"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={(e) => {
                          handleAddToCart(selectedProduct, detailQty, "order", e);
                          setSelectedProduct(null);
                        }}
                        className="btn-primary flex-1 sm:flex-initial px-6"
                        style={{ backgroundColor: "#1B4D2E" }}
                      >
                        + Add {detailQty} Carton(s) to Order
                      </button>
                      <button
                        onClick={(e) => {
                          handleAddToCart(selectedProduct, 1, "quote", e);
                          setSelectedProduct(null);
                        }}
                        className="btn-secondary px-4"
                        style={{ borderColor: "#1B4D2E", color: "#1B4D2E" }}
                      >
                        Get Quote
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      handleAddToCart(selectedProduct, 1, "quote", e);
                      setSelectedProduct(null);
                    }}
                    className="btn-primary w-full py-2.5 text-sm font-semibold rounded"
                    style={{ backgroundColor: "#1B4D2E", color: "#ffffff", borderColor: "#1B4D2E" }}
                  >
                    Get Quote
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Order Cart Drawer Slide panel */}
      <div className={`modal-overlay ${isCartOpen ? "visible" : "invisible"}`} onClick={() => setIsCartOpen(false)}>
        <div
          className={`cart-drawer ${isCartOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cart-drawer-header">
            <h3 className="text-lg font-bold text-zinc-800">
              Order List ({cart.filter((item) => item.mode === "order").length})
            </h3>
            <button onClick={() => setIsCartOpen(false)} className="drawer-close-btn" title="Close" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="cart-drawer-body">
            {cart.filter((item) => item.mode === "order").length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-2 text-zinc-400 italic">
                <ShoppingCart className="w-8 h-8 text-zinc-300" />
                <span>Your order list is empty.</span>
              </div>
            ) : (
              cart.filter((item) => item.mode === "order").map((item) => {
                const meta = parseProductMeta(item.product);
                return (
                  <div key={`${item.product.sku}_order`} className="cart-item relative" style={{ paddingRight: "26px" }}>
                    <img
                      src={item.product.image}
                      alt={item.product.display_name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{meta.Short_Title || item.product.display_name}</span>
                      <span className="cart-item-sub">Carton: {formatCarton(item.product.carton)}</span>
                      
                      <div className="flex items-center mt-2">
                        <div className="qty-counter">
                          <button
                            onClick={() => updateCartQty(item.product.sku, "order", item.quantity - 1)}
                            className="qty-btn"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.sku, "order", item.quantity + 1)}
                            className="qty-btn"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => updateCartQty(item.product.sku, "order", 0)}
                      className="cart-item-remove-btn"
                      title="Remove item"
                    >
                      <Trash2 />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {cart.filter((item) => item.mode === "order").length > 0 && (() => {
            const totalOrderCartons = cart.filter((item) => item.mode === "order").reduce((a, b) => a + b.quantity, 0);
            const isUnderMin = totalOrderCartons < 4;
            return (
              <div className="cart-drawer-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="flex justify-between font-bold text-sm text-zinc-700">
                  <span>Total Cartons:</span>
                  <span style={isUnderMin ? { color: "#d32f2f" } : undefined}>
                    {totalOrderCartons} Ctn {isUnderMin && <span style={{ fontSize: "10px", fontWeight: "normal", color: "#d32f2f" }}>(Min: 4)</span>}
                  </span>
                </div>
                
                {isUnderMin && (
                  <div style={{
                    backgroundColor: "#fff5f5",
                    border: "1px solid #ffe3e3",
                    color: "#e53e3e",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "11px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    lineHeight: "1.3",
                    boxSizing: "border-box"
                  }}>
                    <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0, color: "#e53e3e" }} />
                    <span style={{ textAlign: "left" }}>
                      Minimum order is 4 cartons. Please add at least {4 - totalOrderCartons} more carton(s) to check out.
                    </span>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (isUnderMin) return;
                    setIsCartOpen(false);
                    setSubmitType("order");
                    setShowCheckoutModal(true);
                  }}
                  disabled={isUnderMin}
                  className="btn-checkout"
                  style={isUnderMin ? {
                    opacity: 0.5,
                    cursor: "not-allowed",
                    backgroundColor: "#a1a1aa",
                    borderColor: "#a1a1aa",
                    boxShadow: "none"
                  } : undefined}
                >
                  Proceed Order
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Quote Cart Drawer Slide panel */}
      <div className={`modal-overlay ${isQuoteOpen ? "visible" : "invisible"}`} onClick={() => setIsQuoteOpen(false)}>
        <div
          className={`cart-drawer ${isQuoteOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cart-drawer-header">
            <h3 className="text-lg font-bold text-zinc-800">
              Price Quote Inquiries ({cart.filter((item) => item.mode === "quote").length})
            </h3>
            <button onClick={() => setIsQuoteOpen(false)} className="drawer-close-btn" title="Close" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="cart-drawer-body">
            {cart.filter((item) => item.mode === "quote").length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-2 text-zinc-400 italic py-12">
                <ClipboardList className="w-8 h-8 text-zinc-300" />
                <span>Your price quote inquiry list is empty.</span>
              </div>
            ) : (
              cart.filter((item) => item.mode === "quote").map((item) => {
                const meta = parseProductMeta(item.product);
                const specs = getProductB2BSpecs(item.product, meta);
                return (
                  <div key={`${item.product.sku}_quote`} className="cart-item relative" style={{ paddingRight: "26px" }}>
                    <img
                      src={item.product.image}
                      alt={item.product.display_name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{meta.Short_Title || item.product.display_name}</span>
                      <span className="cart-item-sub font-mono text-[10px] text-zinc-400">SKU: {item.product.sku}</span>
                      <span className="cart-item-sub">Packing: {specs.ctnPacking}</span>
                    </div>

                    <button
                      onClick={() => updateCartQty(item.product.sku, "quote", 0)}
                      className="cart-item-remove-btn"
                      title="Remove item"
                    >
                      <Trash2 />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {cart.filter((item) => item.mode === "quote").length > 0 && (
            <div className="cart-drawer-footer">
              <div className="flex justify-between font-bold text-sm text-zinc-700">
                <span>Selected Items:</span>
                <span>{cart.filter((item) => item.mode === "quote").length} Products</span>
              </div>
              <button
                onClick={() => {
                  setIsQuoteOpen(false);
                  setSubmitType("quote");
                  setShowCheckoutModal(true);
                }}
                className="btn-checkout"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Get Quote
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Dialog Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <form
            onSubmit={handleCheckoutSubmit}
            className="modal-content checkout-modal-form"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setShowCheckoutModal(false)} className="modal-close-btn">
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-zinc-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-zinc-800">
                {submitType === "order" ? "Order Confirmation" : "Quotation Confirmation"}
              </h3>
              <p className="text-xs text-zinc-500">
                {submitType === "order" 
                  ? "Please review your delivery address and contact email below to ensure everything is correct. No payment is required to place your order." 
                  : "Please verify your name, email, and phone number below. We will prepare and send your custom price quotation shortly."}
              </p>
            </div>

            {verifiedRetailer ? (
              // BUYER CHECKOUT FORM
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-900">
                  <strong>Verified Buyer:</strong> {verifiedRetailer.display_name || verifiedRetailer.name}
                </div>

                {submitType === "order" ? (
                  // For Orders, we show delivery locations
                  <>
                    {verifiedRetailer.has_multiple_stores === "true" || verifiedRetailer.has_multiple_stores === true || retailerStores.length > 0 ? (
                      <div className="form-group">
                        <label>Select Delivery Outlet Location:</label>
                        <select
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          required
                        >
                          <option value="">-- Choose Outlet Location --</option>
                          {retailerStores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.display_name} - {s.address} ({s.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Delivery Address:</label>
                        <div className="text-xs text-zinc-700 bg-zinc-50 p-2.5 border border-zinc-200 rounded">
                          <div>{verifiedRetailer.address || "Main Office"}</div>
                          <div>Postcode: {verifiedRetailer.postcode || "-"}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Add Email input for order confirmation */}
                    <div className="form-group">
                      <label>Email Address:</label>
                      <input
                        type="email"
                        required
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        placeholder="e.g. john@company.com"
                      />
                    </div>
                  </>
                ) : (
                  // For Quotes, we show Contact Person, Email and Phone Number input fields, because quote is not delivery!
                  <>
                    <div className="form-group">
                      <label>Contact Person Name:</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="e.g. Masjid Al-Istighfar"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone Number:</label>
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="e.g. +6587654321"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address:</label>
                      <input
                        type="email"
                        required
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        placeholder="e.g. john@company.com"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              // NEW CUSTOMER (GET QUOTATION) FORM
              <div className="flex flex-col gap-1">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800 mb-2">
                  <strong>New Customer:</strong> Enter details to receive a Quotation via WhatsApp.
                </div>
                
                <div className="form-group">
                  <label>Contact Person Name:</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp Phone Number:</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +6587654321"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address:</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="e.g. john@company.com"
                  />
                </div>

                <div className="form-group">
                  <label>Company Name (Optional):</label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="e.g. Acme Supermarket Pte Ltd"
                  />
                </div>
              </div>
            )}

            <div className="checkout-modal-actions">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={submitting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={submitType === "quote" ? { backgroundColor: "var(--primary)" } : undefined}
              >
                {submitting 
                  ? "Submitting..." 
                  : (submitType === "order" ? "Confirm Order" : "Get Quotation")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Bottom Sticky Bar on mobile when cart has items */}
      {cart.length > 0 && !isCartOpen && !isQuoteOpen && (
        <div className="sticky-bottom-bar">
          <div className="sticky-bottom-container gap-2">
            {cart.some(item => item.mode === "order") && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-primary flex-grow text-xs py-2.5"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                View Order List ({cart.filter(item => item.mode === "order").reduce((a, b) => a + b.quantity, 0)})
              </button>
            )}
            {cart.some(item => item.mode === "quote") && (
              <button
                onClick={() => setIsQuoteOpen(true)}
                className="btn-secondary flex-grow text-xs py-2.5"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                View Quote List ({cart.filter(item => item.mode === "quote").reduce((a, b) => a + b.quantity, 0)})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification overlay */}
      {toast && (
        <div 
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            backgroundColor: "#18181b",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "600",
            padding: "10px 18px",
            borderRadius: "9999px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            pointerEvents: "none",
            boxSizing: "border-box",
            whiteSpace: "nowrap"
          }}
        >
          {toast.type === "success" && <span style={{ color: "#4ade80", fontWeight: "bold" }}>✓</span>}
          {toast.type === "error" && <span style={{ color: "#f87171", fontWeight: "bold" }}>✗</span>}
          {toast.type === "warning" && <span style={{ color: "#fbbf24", fontWeight: "bold" }}>⚠</span>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Floating Customer Service Chat Assist Widget */}
      <ChatAssist />

    </div>
  );
}

function ThankYouPage({
  data,
  onClose
}: {
  data: { id: string; type: string; receiver_order_whatsapp: string; summaryText: string };
  onClose: () => void;
}) {
  const isMobile = React.useMemo(() => {
    return /Mobi|Android|iPhone/i.test(navigator.userAgent) || (window.innerWidth < 768);
  }, []);

  const hasWhatsApp = React.useMemo(() => {
    return !!(data.receiver_order_whatsapp && data.receiver_order_whatsapp.trim() && data.receiver_order_whatsapp.trim() !== "0");
  }, [data.receiver_order_whatsapp]);

  const [countdown, setCountdown] = React.useState(10);
  const whatsappTarget = `https://wa.me/${data.receiver_order_whatsapp.replace("+", "")}?text=${encodeURIComponent(data.summaryText)}`;

  React.useEffect(() => {
    if (!isMobile || !hasWhatsApp) return;
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = whatsappTarget;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMobile, hasWhatsApp, whatsappTarget]);

  const handleSendNow = () => {
    window.location.href = whatsappTarget;
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#f4f4f5",
      padding: "16px",
      boxSizing: "border-box",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "32px",
        border: "1px solid #e4e4e7",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "450px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        boxSizing: "border-box",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)"
      }}>
        {/* Success Icon */}
        <div style={{
          width: "64px",
          height: "64px",
          backgroundColor: "#F0FDF4",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1B4D2E",
          boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
          border: "1px solid #DCFCE7"
        }}>
          <CheckCircle2 style={{ width: "36px", height: "36px" }} />
        </div>
        
        {/* Header text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h2 style={{
            fontSize: "22px",
            fontWeight: "900",
            color: "#18181b",
            letterSpacing: "-0.5px",
            margin: 0,
            lineHeight: "1.25"
          }}>
            {data.type === "order" ? "We've received your order!" : "We've received your request!"}
          </h2>
          <p style={{
            color: "#71717a",
            fontSize: "14px",
            lineHeight: "1.5",
            margin: 0
          }}>
            {data.type === "order" 
              ? "We've received your order details and are already starting to prepare everything for you. Our team will keep you updated along the way."
              : "Our sales team is currently reviewing your details. We will prepare your customized catalog and get back to you very soon."}
          </p>
        </div>

        {/* Transaction details card */}
        <div style={{
          width: "100%",
          backgroundColor: "#f4f4f5",
          border: "1px solid #e4e4e7",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          textAlign: "center",
          boxSizing: "border-box"
        }}>
          <span style={{ color: "#71717a", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {data.type === "order" ? "Order Number" : "Request Number"}
          </span>
          <span style={{ color: "#1B4D2E", fontWeight: "800", fontSize: "18px", letterSpacing: "0.5px" }}>
            {data.id}
          </span>
        </div>

        {/* WhatsApp redirection actions */}
        {hasWhatsApp ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", boxSizing: "border-box" }}>
            <button
              onClick={handleSendNow}
              style={{
                width: "100%",
                padding: "14px 20px",
                backgroundColor: "#25D366",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "750",
                border: "none",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 6px -1px rgba(37, 211, 102, 0.2)",
                cursor: "pointer",
                transition: "background-color 0.2s",
                boxSizing: "border-box"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#20ba59"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#25D366"}
            >
              <MessageSquare style={{ width: "18px", height: "18px", fill: "currentColor" }} />
              {isMobile ? "Send to WhatsApp" : "Send via WhatsApp"}
            </button>
            
            {isMobile ? (
              <p style={{ color: "#71717a", fontSize: "12px", fontWeight: "600", margin: 0 }}>
                Redirecting to WhatsApp in <span style={{ color: "#1B4D2E", fontWeight: "700" }}>{countdown}</span> seconds...
              </p>
            ) : (
              <p style={{ color: "#71717a", fontSize: "12px", lineHeight: "1.4", margin: 0, maxWidth: "320px", textAlign: "center" }}>
                Please click the button above to send your summary details directly to our sales team on WhatsApp.
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: "#71717a", fontSize: "13px", lineHeight: "1.5", margin: 0, maxWidth: "340px", textAlign: "center", fontStyle: "italic" }}>
            Our team will contact you directly via your registered email address or phone number. Have a wonderful day!
          </p>
        )}

        {/* Catalog Dismiss Button */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#71717a",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "4px",
            textDecoration: "underline",
            outline: "none"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "#18181b"}
          onMouseOut={(e) => e.currentTarget.style.color = "#71717a"}
        >
          Back to Catalog
        </button>
      </div>
    </div>
  );
}
