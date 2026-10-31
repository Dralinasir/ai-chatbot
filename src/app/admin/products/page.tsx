
"use client";

import {
  FormEvent,
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Package,
  RefreshCw,
  Pencil,
  Archive,
  RotateCcw,
  X,
  Upload,
  Image as ImageIcon,
  Search,
  Filter,
} from "lucide-react";

type Gender = "Male" | "Female" | "Unisex";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  gender: Gender;
  price: number | string;
  compare_at_price: number | string | null;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  gender: Gender;
  price: string;
  compare_at_price: string;
  image_url: string;
  stock_quantity: string;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "",
  gender: "Unisex",
  price: "",
  compare_at_price: "",
  image_url: "",
  stock_quantity: "0",
  is_active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load products.");
      }

      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkAdminAndLoad() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.href = "/admin-login";
          return;
        }

        await loadProducts();
      } catch {
        window.location.href = "/admin-login";
      }
    }

    checkAdminAndLoad();
  }, []);

  function handleNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setForm((current) => ({
      ...current,
      name: value,
      slug,
    }));
  }

  function startEditing(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      category: product.category,
      gender: product.gender || "Unisex",
      price: String(product.price),
      compare_at_price:
        product.compare_at_price == null
          ? ""
          : String(product.compare_at_price),
      image_url: product.image_url || "",
      stock_quantity: String(product.stock_quantity),
      is_active: product.is_active,
    });

    setShowForm(true);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, WEBP or AVIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.message || "Image upload failed.");
      }

      setForm((current) => ({
        ...current,
        image_url: data.imageUrl,
      }));

      setMessage("Image uploaded successfully!");
    } catch (err) {
      console.error("Image upload error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload image."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploading) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `/api/products/${editingId}` : "/api/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            compare_at_price:
              form.compare_at_price === ""
                ? null
                : Number(form.compare_at_price),
            stock_quantity: Number(form.stock_quantity),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save product.");
      }

      if (isEditing) {
        setProducts((current) =>
          current.map((product) =>
            product.id === editingId ? data.product : product
          )
        );
      } else {
        setProducts((current) => [data.product, ...current]);
      }

      closeForm();

      setMessage(
        isEditing
          ? "Product updated successfully!"
          : "Product added successfully!"
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(product: Product) {
    const confirmed = window.confirm(
      `Archive "${product.name}"? It will no longer be visible in the store.`
    );

    if (!confirmed) return;

    setActionId(product.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to archive product.");
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, is_active: false }
            : item
        )
      );

      setMessage("Product archived successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleRestore(product: Product) {
    setActionId(product.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          category: product.category,
          gender: product.gender || "Unisex",
          price: Number(product.price),
          compare_at_price:
            product.compare_at_price == null
              ? null
              : Number(product.compare_at_price),
          image_url: product.image_url || "",
          stock_quantity: product.stock_quantity,
          is_active: true,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin-login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to restore product.");
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? data.product : item
        )
      );

      setMessage("Product restored successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setActionId(null);
    }
  }

  // Automatically get categories from the loaded products.
  const categories = Array.from(
    new Set(products.map((product) => product.category))
  ).sort((a, b) => a.localeCompare(b));

  // Search, category and status filters work together.
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.slug.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    const matchesStatus =
      filter === "all" ||
      (filter === "active" && product.is_active) ||
      (filter === "inactive" && !product.is_active);

    const matchesCategory =
      categoryFilter === "all" ||
      product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCount = products.filter((p) => p.is_active).length;
  const inactiveCount = products.length - activeCount;

  function clearFilters() {
    setSearchTerm("");
    setCategoryFilter("all");
    setFilter("all");
  }

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    categoryFilter !== "all" ||
    filter !== "all";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Product Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage products, gender, prices, images and inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadProducts}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => {
                if (showForm) {
                  closeForm();
                } else {
                  setEditingId(null);
                  setForm(emptyForm);
                  setShowForm(true);
                  setMessage("");
                  setError("");
                }
              }}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Close Form" : "Add Product"}
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="mt-2 text-2xl font-bold">{products.length}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Active Products</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Archived Products</p>
            <p className="mt-2 text-2xl font-bold text-gray-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-6 text-xl font-semibold">
              {editingId !== null ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Premium T-Shirt"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product Slug *
                  </label>
                  <input
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="premium-t-shirt"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category *
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="">Select category</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Gender / Section *
                  </label>
                  <select
                    required
                    value={form.gender}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gender: e.target.value as Gender,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unisex">Unisex (Both sections)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Unisex products will appear in both Male and Female sections.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price (PKR) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="2500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Compare at Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compare_at_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        compare_at_price: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="3000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Stock Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Product Image
                  </label>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {uploading ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <Upload size={17} />
                        )}
                        {uploading ? "Uploading..." : "Choose & Upload Image"}
                      </button>

                      <p className="text-xs text-gray-500">
                        JPG, PNG, WEBP or AVIF. Maximum 5 MB.
                      </p>
                    </div>

                    {form.image_url && (
                      <div className="mt-5">
                        <p className="mb-2 text-sm font-medium">
                          Image Preview
                        </p>

                        <div className="flex flex-wrap items-start gap-4">
                          <img
                            src={form.image_url}
                            alt="Product preview"
                            className="h-36 w-36 rounded-lg border border-gray-200 bg-white object-contain"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="break-all text-xs text-gray-500">
                              {form.image_url}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  image_url: "",
                                }))
                              }
                              className="mt-3 text-sm font-medium text-red-600 hover:text-red-800"
                            >
                              Remove image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!form.image_url && (
                      <div className="mt-5 flex items-center gap-2 text-sm text-gray-400">
                        <ImageIcon size={20} />
                        No product image selected.
                      </div>
                    )}

                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <label className="mb-2 block text-xs font-medium text-gray-500">
                        Or enter an existing image URL
                      </label>
                      <input
                        type="url"
                        value={form.image_url}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            image_url: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                        placeholder="https://example.com/product.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Write product description..."
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Make product active and visible in the store
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading Image..."
                    : saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Product"
                        : "Save Product"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving || uploading}
                  className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">All Products</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by product name, slug or category..."
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="relative">
                <Filter
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Archived" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    filter === option.value
                      ? "bg-black text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="mx-auto mb-3 text-gray-300" size={40} />
              <h3 className="font-semibold">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try another search, category or status filter.
              </p>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Gender</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <ImageIcon size={20} />
                            </div>
                          )}

                          <div>
                            <div className="font-semibold">
                              {product.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">{product.category}</td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {product.gender || "Unisex"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        Rs. {Number(product.price).toLocaleString("en-PK")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            product.stock_quantity === 0
                              ? "font-semibold text-red-600"
                              : "text-gray-700"
                          }
                        >
                          {product.stock_quantity}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            product.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.is_active ? "Active" : "Archived"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(product)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          {product.is_active ? (
                            <button
                              onClick={() => handleArchive(product)}
                              disabled={actionId === product.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Archive size={14} />
                              {actionId === product.id
                                ? "Working..."
                                : "Archive"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(product)}
                              disabled={actionId === product.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              <RotateCcw size={14} />
                              {actionId === product.id
                                ? "Working..."
                                : "Restore"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
