from app.models.product import Product


def available_stock(product: Product, variant_sku: str | None) -> int:
    if variant_sku and product.variants:
        match = next((v for v in product.variants if v.sku == variant_sku), None)
        return match.stock_qty if match else 0
    return product.stock_qty


def adjust_stock(product: Product, variant_sku: str | None, delta: int) -> None:
    if variant_sku and product.variants:
        for variant in product.variants:
            if variant.sku == variant_sku:
                variant.stock_qty = max(0, variant.stock_qty + delta)
        product.stock_qty = sum(v.stock_qty for v in product.variants)
    else:
        product.stock_qty = max(0, product.stock_qty + delta)
