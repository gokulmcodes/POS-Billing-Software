from app.models.category import Category
from app.models.customer import Customer
from app.models.ledger import LedgerEntry
from app.models.product import Product, ProductVariant
from app.models.purchase import Purchase, PurchaseItem
from app.models.return_ import ReturnItem, SalesReturn
from app.models.sale import Sale, SaleItem
from app.models.supplier import Supplier
from app.models.user import User

ALL_DOCUMENTS = [
    User,
    Category,
    Product,
    Supplier,
    Customer,
    Purchase,
    Sale,
    SalesReturn,
    LedgerEntry,
]

__all__ = [
    "User",
    "Category",
    "Product",
    "ProductVariant",
    "Supplier",
    "Customer",
    "Purchase",
    "PurchaseItem",
    "Sale",
    "SaleItem",
    "SalesReturn",
    "ReturnItem",
    "LedgerEntry",
    "ALL_DOCUMENTS",
]
