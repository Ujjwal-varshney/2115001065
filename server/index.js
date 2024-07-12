const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // To generate unique IDs for products
const app = express();
const port = 3000;

const companyList = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
const productCategories = ["Phone", "Computer", "TV", "Earphone", "Tablet", "Charger", "Mouse", "Keypad", "Bluetooth", "Pendrive", "Remote", "Speaker", "Headset", "Laptop", "PC"];

const BASE_API_URL = 'http://20.244.56.144/test/companies';

// Function to retrieve top n products for a specified company, category, minPrice, and maxPrice
const fetchTopProducts = async (company, category, limit, minPrice, maxPrice) => {
    try {
        const apiUrl = `${BASE_API_URL}/${company}/categories/${category}/products?top=${limit}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
        console.log(`Requesting URL: ${apiUrl}`); // Logging the URL

        // Example: Add headers for authentication
        const headers = {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIwNzgxNjk5LCJpYXQiOjE3MjA3ODEzOTksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjQ2Mzc2ZWRhLWY4NzEtNGIxZC1iNWVhLTVkZmFhZGU0MGJlYiIsInN1YiI6InVqandhbC52YXJzaG5leV9jczIxQGdsYS5hYy5pbiJ9LCJjb21wYW55TmFtZSI6IkFmZm9yZCBNZWRpY2FsIiwiY2xpZW50SUQiOiI0NjM3NmVkYS1mODcxLTRiMWQtYjVlYS01ZGZhYWRlNDBiZWIiLCJjbGllbnRTZWNyZXQiOiJOc2ZIVk5KTkdTVnZiVG1tIiwib3duZXJOYW1lIjoiVWpqd2FsIFZhcnNobmV5Iiwib3duZXJFbWFpbCI6InVqandhbC52YXJzaG5leV9jczIxQGdsYS5hYy5pbiIsInJvbGxObyI6IjIxMTUwMDEwNjUifQ.FnSdKyidrmN2CGWmQCeTH_Pz8_NdbSvyalvBlRT0BXs', // Replace with actual token
        };

        const response = await axios.get(apiUrl, { headers });
        return response.data.map(product => ({
            ...product,
            id: uuidv4(),
        }));
    } catch (error) {
        console.error(`Error fetching products for ${company}, ${category}:`, error.message);
        throw error;
    }
};


// Endpoint to get top n products for a category
app.get('/categories/:categoryName/products', async (req, res) => {
    try {
        const { categoryName } = req.params;
        const { limit = 10, minPrice = 0, maxPrice = 10000, sortBy, order = 'asc', page = 1 } = req.query;

        console.log(`Received request: category=${categoryName}, limit=${limit}, minPrice=${minPrice}, maxPrice=${maxPrice}, sortBy=${sortBy}, order=${order}, page=${page}`);

        if (!productCategories.includes(categoryName)) {
            console.log(`Invalid category: ${categoryName}`);
            return res.status(400).json({ error: 'Invalid category' });
        }

        let aggregatedProducts = [];
        for (const company of companyList) {
            const products = await fetchTopProducts(company, categoryName, limit, minPrice, maxPrice);
            aggregatedProducts = aggregatedProducts.concat(products);
        }

        // Sorting
        if (sortBy) {
            aggregatedProducts.sort((a, b) => {
                if (order === 'asc') {
                    return a[sortBy] > b[sortBy] ? 1 : -1;
                } else {
                    return a[sortBy] < b[sortBy] ? 1 : -1;
                }
            });
        }

        // Pagination
        const pageSize = parseInt(limit, 10);
        const totalProducts = aggregatedProducts.length;
        const totalPages = Math.ceil(totalProducts / pageSize);
        const currentPage = Math.min(Math.max(parseInt(page, 10), 1), totalPages);
        const paginatedProducts = aggregatedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        res.json({
            products: paginatedProducts,
            page: currentPage,
            totalPages,
            totalProducts,
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to get details of a specific product
app.get('/categories/:categoryName/products/:productId', async (req, res) => {
    try {
        const { categoryName, productId } = req.params;

        console.log(`Received request for product details: category=${categoryName}, productId=${productId}`);

        const productDetails = await fetchTopProducts(categoryName).find(product => product.id === productId);

        if (!productDetails) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(productDetails);
    } catch (error) {
        console.error('Error fetching product details:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
