import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDB();
        
        const [categories, products, suppliers, expenses, sales] = await Promise.all([
            db.getAll('inventory_categories'),
            db.getAll('products'),
            db.getAll('suppliers'),
            db.getAll('expenses'),
            db.getAll('sales')
        ]);

        return NextResponse.json({
            categories: categories.length,
            products: products.length,
            suppliers: suppliers.length,
            expenses: expenses.length,
            sales: sales.length
        });
    } catch (error) {
        console.error('Error checking initialization status:', error);
        return NextResponse.json(
            { error: 'Failed to check initialization status' },
            { status: 500 }
        );
    }
}