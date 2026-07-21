import type { Request, Response } from "express";
import { execute, query } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";

interface ProductRow {
  id: number;
  name: string;
  meta: string;
  description: string;
  price: number;
  filters: string;
  img: string;
  stock: number;
}

export async function listProducts(_req: Request, res: Response): Promise<void> {
  const rows = await query<ProductRow>(
    "SELECT id, name, meta, description, price, filters, img, stock FROM products ORDER BY id ASC",
  );
  res.json({ status: "success", data: rows });
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const rows = await query<ProductRow>(
    "SELECT id, name, meta, description, price, filters, img, stock FROM products WHERE id = ?",
    [id],
  );
  if (rows.length === 0) throw ApiError.notFound("Product not found");
  res.json({ status: "success", data: rows[0] });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const b = req.body as ProductRow;
  const result = await execute(
    "INSERT INTO products (name, meta, description, price, filters, img, stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [b.name, b.meta, b.description, b.price, b.filters, b.img, b.stock ?? 0],
  );
  res.status(201).json({ status: "success", message: "Product added successfully", id: result.insertId });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const b = req.body as ProductRow;
  const result = await execute(
    `UPDATE products SET name = ?, meta = ?, description = ?, price = ?, filters = ?, img = ?, stock = ?
     WHERE id = ?`,
    [b.name, b.meta, b.description, b.price, b.filters, b.img, b.stock ?? 0, id],
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Product not found");
  res.json({ status: "success", message: "Product updated successfully" });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const result = await execute("DELETE FROM products WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw ApiError.notFound("Product not found");
  res.json({ status: "success", message: "Product deleted successfully" });
}
