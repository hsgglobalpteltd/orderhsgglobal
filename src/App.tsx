import * as React from "react";
import { Search, ShoppingCart, X, Plus, Minus, Printer, AlertCircle, Trash2, ClipboardList, CheckCircle2, MessageSquare } from "lucide-react";

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

  // Retailer Verification states
  const [retailerInput, setRetailerInput] = React.useState("");
  const [verifiedRetailer, setVerifiedRetailer] = React.useState<any | null>(null);
  const [retailerStores, setRetailerStores] = React.useState<any[]>([]);
  const [retailerSkus, setRetailerSkus] = React.useState<string[]>([]);
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
  const [custPostcode, setCustPostcode] = React.useState("");
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
    if (oId) setOrderIdParam(oId);
    if (qId) setQuoteIdParam(qId);
  }, []);

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
        showToast("Retailer verified successfully!", "success");
      } else {
        setVerifiedRetailer(null);
        setRetailerStores([]);
        setRetailerSkus([]);
        showToast("Invalid Retailer ID. Please try again.", "error");
      }
    } catch (err) {
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
  };

  // Add product to cart helper
  const handleAddToCart = (product: Product, qty: number, mode: "order" | "quote" = "order") => {
    const parsedQty = Number(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.sku === product.sku && item.mode === mode);
      if (existing) {
        return prev.map((item) =>
          item.product.sku === product.sku && item.mode === mode ? { ...item, quantity: item.quantity + parsedQty } : item
        );
      }
      return [...prev, { product, quantity: parsedQty, mode }];
    });
    showToast(`Added ${parsedQty} carton(s) to ${mode === "order" ? "cart" : "quote"}`, "success");
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
        
        let retailerNameDisplay = verifiedRetailer.name || verifiedRetailer.display_name || "Retailer";
        if (selectedStoreId) {
          // Append Store ID in parentheses next to name
          retailerNameDisplay = `${retailerNameDisplay} (${selectedStoreId})`;
        }
        payload.retailer_name = retailerNameDisplay;
        
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
      } else {
        if (!custName.trim() || !custPhone.trim() || !custEmail.trim() || !custAddress.trim() || !custPostcode.trim()) {
          showToast("Please fill in all contact details", "warning");
          setSubmitting(false);
          return;
        }
        payload.customer_name = custName.trim();
        payload.customer_phone = custPhone.trim();
        payload.customer_email = custEmail.trim();
        payload.address = custAddress.trim();
        payload.postcode = custPostcode.trim();
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
    } catch (err) {
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
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-zinc-500">Loading Order Summary...</p>
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
              className="mt-2 px-4 py-2 bg-orange-500 text-white rounded font-semibold text-sm hover:bg-orange-600"
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
          <div className="tracking-header">
            <h2 className="text-xl font-bold">HSG Global</h2>
            <p className="text-xs opacity-90 mt-1">Order Tracking & Receipt</p>
          </div>

          <div className="tracking-body">
            <div className={`tracking-status-bar ${isCompleted ? "completed" : ""}`}>
              <span>STATUS:</span>
              <span className="text-sm uppercase">{rec.status || "PENDING"}</span>
            </div>

            <div className="tracking-info-grid">
              <div className="tracking-info-item">
                <span>Reference ID</span>
                <span>{rec.id}</span>
              </div>
              <div className="tracking-info-item">
                <span>Date Placed</span>
                <span>{dateStr}</span>
              </div>
              
              {trackingType === "order" ? (
                <>
                  <div className="tracking-info-item">
                <span>Buyer Name</span>
                <span>{rec.retailer_name}</span>
              </div>
              <div className="tracking-info-item">
                <span>Buyer ID</span>
                <span>{rec.retailer_id}</span>
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
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Itemised List</h4>
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
              <Printer className="w-4 h-4" /> Print Document
            </button>

            <button
              onClick={() => {
                window.location.href = window.location.origin;
              }}
              className="btn-print-summary bg-zinc-500 hover:bg-zinc-600 mt-2 text-white"
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
          >
            HSG Global
          </a>
          
          {/* Desktop search wrapper */}
          <div className="search-input-wrapper desktop-only">
            <input
              type="text"
              placeholder="Search products, brands, paste types..."
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
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {verifiedRetailer && (
              <button onClick={() => { setIsCartOpen(true); setIsQuoteOpen(false); }} className="cart-icon-btn" title="Order List">
                <ShoppingCart className="w-5 h-5" />
                {cart.filter(item => item.mode === "order").length > 0 && (
                  <span className="cart-badge">
                    {cart.filter(item => item.mode === "order").reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            )}

            <button onClick={() => { setIsQuoteOpen(true); setIsCartOpen(false); }} className={`cart-icon-btn ${verifiedRetailer ? "ml-2" : ""}`} title="Quote List">
              <ClipboardList className="w-5 h-5" />
              {cart.filter(item => item.mode === "quote").length > 0 && (
                <span className="cart-badge">
                  {cart.filter(item => item.mode === "quote").reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Subheader: Buyer verification inputs */}
      <div className="verification-panel">
        <div className="verification-container justify-center">
          {verifiedRetailer ? (
            <div className="flex flex-col items-center justify-center w-full py-1 text-center gap-1 bg-orange-50 border border-orange-100 rounded-lg p-2">
              <span className="text-sm font-bold text-orange-700">
                Welcome, {verifiedRetailer.name || verifiedRetailer.display_name}
              </span>
              <button
                onClick={handleClearRetailer}
                className="btn-link"
              >
                (Not {verifiedRetailer.name || verifiedRetailer.display_name}? Change Buyer ID)
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyRetailer} className="flex flex-col md:flex-row justify-center items-center w-full gap-3 py-1 flex-wrap">
              <span className="text-xs font-bold text-zinc-600">Enter Buyer ID to activate catalog:</span>
              <div className="retailer-input-group justify-center">
                <input
                  type="text"
                  placeholder="Buyer ID"
                  value={retailerInput}
                  onChange={(e) => setRetailerInput(e.target.value)}
                  disabled={verifying}
                />
                <button type="submit" disabled={verifying} className="btn-verify">
                  {verifying ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="main-wrapper">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {/* Sticky category tabs container */}
        <div className="sticky-tabs-container">
          {/* Category categories scrolling bar */}
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
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-semibold">Loading Catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-md p-6">
            <p className="text-sm text-zinc-400 italic">No products found matching your filter selections.</p>
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
                      return (
                        <div key={p.sku} className="product-card" onClick={() => handleOpenProduct(p)}>
                          <img
                            src={p.image}
                            alt={p.display_name}
                            className="product-card-img"
                          />
                           <div className="product-card-info">
                            <span className="product-card-title">{meta.Short_Title || p.display_name}</span>
                            <span className="product-card-specs">Carton: {formatCarton(p.carton)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(p, 1, "quote");
                              }}
                              className="btn-card-quote"
                              style={!verifiedRetailer ? { backgroundColor: "var(--primary)", color: "var(--white)", borderColor: "var(--primary)" } : undefined}
                            >
                              Get Quote
                            </button>
                            
                            {verifiedRetailer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(p, 1, "order");
                                }}
                                className="btn-card-add"
                              >
                                + Add 1 Carton
                              </button>
                            )}
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

        {/* Terms and Conditions Footer */}
        <footer className="tc-footer">
          <div className="tc-sticky-note">
            <h4>Terms & Conditions</h4>
            <ul>
              <li><strong>Delivery Timeline:</strong> Standard delivery completed within a maximum of 4 working days.</li>
              <li><strong>Urgent Requests:</strong> Urgent delivery requirements must be negotiated directly prior to submission.</li>
              <li><strong>Minimum Quantity:</strong> Orders are subject to a strict minimum of 4 cartons per delivery.</li>
              <li><strong>Pricing:</strong> Item prices are based on established B2B commercial agreements.</li>
              <li><strong>Payment Terms:</strong> Settlements must comply with established B2B contractual agreements.</li>
            </ul>
          </div>
        </footer>

      </div>

      {/* Swipeable Product Detail Modal */}
      {selectedProduct && (() => {
        const meta = parseProductMeta(selectedProduct);
        const imagesList = [
          selectedProduct.image,
          ...(meta.Images || []).filter((img) => img !== selectedProduct.image)
        ].filter(Boolean);
        return (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedProduct(null)} className="modal-close-btn">
                <X className="w-4 h-4" />
              </button>

              <div className="product-detail-hero">
                <img
                  src={imagesList[carouselIndex]}
                  alt={selectedProduct.display_name}
                  className="detail-carousel-img"
                />
                
                {imagesList.length > 1 && (
                  <div className="carousel-dots">
                    {imagesList.map((_, i) => (
                      <span
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`carousel-dot ${carouselIndex === i ? "active" : ""}`}
                      ></span>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-detail-body">
                <span className="product-detail-brand">
                  {brands.find((b) => b.id === selectedProduct.brands_id)?.display_name}
                </span>
                <h3 className="product-detail-title">{meta.Title || selectedProduct.display_name}</h3>
                
                <div className="flex items-center gap-2">
                  <span className="product-card-specs">SKU: {selectedProduct.sku}</span>
                  <span className="product-card-specs">Carton: {formatCarton(selectedProduct.carton)}</span>
                </div>

                {/* Contact for Pricing is removed */}

                <p className="product-detail-desc">{meta.Long_Des || meta.Short_Des}</p>

                <div className="detail-buy-container">
                  <div className="detail-qty-row">
                    <span className="detail-qty-label">Quantity:</span>
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

                  <div className="flex gap-2">
                    {verifiedRetailer && (
                      <button
                        onClick={() => {
                          handleAddToCart(selectedProduct, detailQty, "order");
                          setSelectedProduct(null);
                        }}
                        className="btn-primary flex-grow"
                      >
                        Add to Cart
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleAddToCart(selectedProduct, detailQty, "quote");
                        setSelectedProduct(null);
                      }}
                      className="btn-secondary flex-grow"
                      style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                    >
                      Add to Quote
                    </button>
                  </div>
                </div>
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
            <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-full hover:bg-zinc-100">
              <X className="w-5 h-5 text-zinc-500" />
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
                  <div key={`${item.product.sku}_order`} className="cart-item">
                    <img
                      src={item.product.image}
                      alt={item.product.display_name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{meta.Short_Title || item.product.display_name}</span>
                      <span className="cart-item-sub">Carton: {formatCarton(item.product.carton)}</span>
                      
                      <div className="flex justify-between items-center mt-2">
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
                        <button
                          onClick={() => updateCartQty(item.product.sku, "order", 0)}
                          className="btn-remove"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
              Quote List ({cart.filter((item) => item.mode === "quote").length})
            </h3>
            <button onClick={() => setIsQuoteOpen(false)} className="p-1 rounded-full hover:bg-zinc-100">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          <div className="cart-drawer-body">
            {cart.filter((item) => item.mode === "quote").length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-2 text-zinc-400 italic">
                <ClipboardList className="w-8 h-8 text-zinc-300" />
                <span>Your quote list is empty.</span>
              </div>
            ) : (
              cart.filter((item) => item.mode === "quote").map((item) => {
                const meta = parseProductMeta(item.product);
                return (
                  <div key={`${item.product.sku}_quote`} className="cart-item">
                    <img
                      src={item.product.image}
                      alt={item.product.display_name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-title">{meta.Short_Title || item.product.display_name}</span>
                      <span className="cart-item-sub">Carton: {formatCarton(item.product.carton)}</span>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="qty-counter">
                          <button
                            onClick={() => updateCartQty(item.product.sku, "quote", item.quantity - 1)}
                            className="qty-btn"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.sku, "quote", item.quantity + 1)}
                            className="qty-btn"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => updateCartQty(item.product.sku, "quote", 0)}
                          className="btn-remove"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.filter((item) => item.mode === "quote").length > 0 && (
            <div className="cart-drawer-footer">
              <div className="flex justify-between font-bold text-sm text-zinc-700">
                <span>Total Cartons:</span>
                <span>{cart.filter((item) => item.mode === "quote").reduce((a, b) => a + b.quantity, 0)} Ctn</span>
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
                Proceed Quote
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
                {submitType === "order" ? "Checkout Confirmation" : "Quotation Confirmation"}
              </h3>
              <p className="text-xs text-zinc-500">
                {submitType === "order" 
                  ? "Place your carton order list. No money will be collected." 
                  : "Submit your request list to receive a price quotation."}
              </p>
            </div>

            {verifiedRetailer ? (
              // BUYER CHECKOUT FORM
              <div className="flex flex-col gap-3">
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-800">
                  <strong>Verified Buyer:</strong> {verifiedRetailer.name} ({verifiedRetailer.id})
                </div>

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
                  <label>Delivery/Billing Address:</label>
                  <input
                    type="text"
                    required
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="e.g. Blk 123 Toa Payoh Lorong 1"
                  />
                </div>

                <div className="form-group">
                  <label>Postal Code:</label>
                  <input
                    type="text"
                    required
                    value={custPostcode}
                    onChange={(e) => setCustPostcode(e.target.value)}
                    placeholder="e.g. 310123"
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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[300] bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast.type === "success" && <span className="text-green-400">✓</span>}
          {toast.type === "error" && <span className="text-red-400">✗</span>}
          <span>{toast.message}</span>
        </div>
      )}

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
          backgroundColor: "#ffebd8",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ff6f00",
          boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
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
          <span style={{ color: "#18181b", fontWeight: "800", fontSize: "18px", letterSpacing: "0.5px" }}>
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
                Redirecting to WhatsApp in <span style={{ color: "#ff6f00", fontWeight: "700" }}>{countdown}</span> seconds...
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
