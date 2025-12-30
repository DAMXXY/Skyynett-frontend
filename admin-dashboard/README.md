# Admin Dashboard for Managing Categories and Products

This project is an admin dashboard built with Node.js, Express, and MongoDB. It allows administrators to manage product categories and products efficiently. The dashboard provides a clean and responsive user interface for performing CRUD operations on products and categories.

## Project Structure

```
admin-dashboard
├── server
│   ├── config
│   │   └── db.js
│   ├── models
│   │   ├── Category.js
│   │   └── Product.js
│   ├── routes
│   │   ├── categories.js
│   │   └── products.js
│   ├── middleware
│   │   └── upload.js
│   ├── controllers
│   │   ├── categoryController.js
│   │   └── productController.js
│   ├── uploads
│   │   └── .gitkeep
│   └── server.js
├── public
│   ├── css
│   │   └── admin-style.css
│   ├── js
│   │   └── admin-script.js
│   └── admin.html
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd admin-dashboard
   ```

2. **Install Dependencies**
   Make sure you have Node.js and npm installed. Then run:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   ```

4. **Database Setup**
   Ensure you have a MongoDB database set up. You can use MongoDB Atlas or a local MongoDB instance.

5. **Run the Server**
   Start the server using:
   ```bash
   node server/server.js
   ```
   The server will run on `http://localhost:5000` by default.

6. **Access the Admin Dashboard**
   Open `public/admin.html` in your web browser to access the admin dashboard.

## Features

- **Manage Categories**: Fetch and display all categories from the backend.
- **Manage Products**: View products by category, add new products, and delete existing products.
- **Image Upload**: Upload product images using the provided form.
- **Real-time Updates**: Changes made in the admin dashboard reflect immediately on the public site.

## API Endpoints

- `GET /categories`: Fetch all categories.
- `GET /categories/:id/products`: Fetch all products in a specific category.
- `POST /products`: Add a new product to a category.
- `DELETE /products/:id`: Delete a product by ID.

## Technologies Used

- Node.js
- Express
- MongoDB (Mongoose)
- Multer (for file uploads)
- HTML/CSS/JavaScript for the frontend

## License

This project is licensed under the MIT License.