"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductDialog } from "./product-dialog";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Package, Settings, Boxes, Tag } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  SERVICE: { label: "Servicio", icon: Settings, color: "text-blue-500 bg-blue-500/10" },
  DIGITAL: { label: "Digital", icon: Tag, color: "text-purple-500 bg-purple-500/10" },
  PHYSICAL: { label: "Físico", icon: Boxes, color: "text-amber-500 bg-amber-500/10" },
};

export function ProductsView() {
  const t = useTranslations("products");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProducts({ search: debouncedSearch || undefined });
  const products = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => { setEditingProduct(null); setDialogOpen(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No hay productos</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Añade productos o servicios para usarlos en facturas
          </p>
          <Button size="sm" onClick={() => { setEditingProduct(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir producto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any, i: number) => {
            const config = typeConfig[product.type] ?? { label: "Servicio", icon: Settings, color: "text-blue-500 bg-blue-500/10" };
            const Icon = config.icon;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setEditingProduct(product); setDialogOpen(true); }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{formatCurrency(Number(product.price))}</span>
                      {product.tax && (
                        <span className="text-xs text-muted-foreground">+{Number(product.tax.rate)}% IVA</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
      />
    </div>
  );
}
