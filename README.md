# Carwash Backend API

Backend API untuk aplikasi mobile carwash menggunakan Node.js, Express, TypeScript, dan Prisma.

## Anggota Kelompok 3 Pemrograman Mobile
1. Muhammad Najib Saragih (12350111357)
2. Rendy Rizqika Maulana (12350111267)
3. M. Hafiz Akbar (12350114518)
4. Muhammad Agil (12350111158)

## Fitur Utama

### 🔐 Autentikasi & Otorisasi
- Registrasi dan login user
- JWT token authentication
- Role-based access control (user/admin)
- Password hashing dengan bcrypt

### 📅 Manajemen Booking
- Pembuatan booking dengan pilihan layanan
- Pengecekan ketersediaan slot waktu
- Perubahan status booking (pending → processing → done)
- Pembatalan booking
- Riwayat booking user

### 💰 Manajemen Transaksi
- Pembuatan transaksi untuk booking
- Konfirmasi pembayaran
- Riwayat transaksi
- Multiple payment methods (ewallet, transfer, cash)

### 🚗 Manajemen Kendaraan
- CRUD kendaraan user
- Riwayat booking per kendaraan
- Statistik penggunaan kendaraan

### ⭐ Sistem Review
- Review dan rating untuk layanan
- Statistik rating per layanan
- CRUD review user

### 👨‍💼 Fitur Admin
- Dashboard dengan statistik
- Manajemen semua booking
- Laporan keuangan
- Manajemen user
- CRUD layanan

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **CORS**: cors
- **Environment**: dotenv

## Database Schema

### Models
- **User**: Data pengguna dan autentikasi
- **Service**: Katalog layanan cucian
- **Booking**: Data pemesanan cucian
- **Transaction**: Data transaksi pembayaran
- **Vehicle**: Data kendaraan pelanggan
- **Review**: Ulasan dan rating
- **BookingStatusHistory**: Riwayat perubahan status booking

## Installation & Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd carwash-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env
```
Edit `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/carwash_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
```

4. **Setup database**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

## API Endpoints

### 🔐 Authentication
```
POST /api/users/register     - Register new user
POST /api/users/login        - Login user
GET  /api/users/profile      - Get user profile
PUT  /api/users/profile      - Update user profile
PATCH /api/users/change-password - Change password
```

### 📅 Bookings
```
GET  /api/bookings                    - Get user bookings
POST /api/bookings                    - Create new booking
GET  /api/bookings/:id                - Get booking details
PATCH /api/bookings/:id/cancel        - Cancel booking
GET  /api/bookings/available-slots    - Get available time slots
```

### 🛍️ Services
```
GET  /api/services          - Get all services
GET  /api/services/:id      - Get service details
POST /api/services          - Create service (admin)
PUT  /api/services/:id      - Update service (admin)
DELETE /api/services/:id    - Delete service (admin)
PATCH /api/services/:id/activate - Activate service (admin)
```

### 💰 Transactions
```
GET  /api/transactions              - Get user transactions
POST /api/transactions              - Create transaction
GET  /api/transactions/:id          - Get transaction details
PATCH /api/transactions/:id/confirm - Confirm payment
PATCH /api/transactions/:id/status  - Update status (admin)
```

### 🚗 Vehicles
```
GET  /api/vehicles          - Get user vehicles
POST /api/vehicles          - Add new vehicle
GET  /api/vehicles/:id      - Get vehicle details
PUT  /api/vehicles/:id      - Update vehicle
DELETE /api/vehicles/:id    - Delete vehicle
PATCH /api/vehicles/:id/activate - Activate vehicle
GET  /api/vehicles/:id/stats - Get vehicle statistics
```

### ⭐ Reviews
```
GET  /api/reviews               - Get user reviews
POST /api/reviews               - Create review
GET  /api/reviews/all           - Get all reviews (public)
GET  /api/reviews/stats         - Get review statistics
GET  /api/reviews/booking/:id   - Get review by booking
PUT  /api/reviews/:id           - Update review
DELETE /api/reviews/:id         - Delete review
```

### 👨‍💼 Admin
```
GET  /api/admin/dashboard        - Get dashboard statistics
GET  /api/admin/bookings         - Get all bookings
PATCH /api/admin/bookings/:id/status - Update booking status
GET  /api/admin/financial-report - Get financial report
GET  /api/admin/users           - Get all users
```

## Request/Response Examples

### Register User
```bash
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Booking
```bash
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "service-uuid",
  "vehicleId": "vehicle-uuid",
  "date": "2024-01-15",
  "timeSlot": "09:00-10:00",
  "location": "Jl. Sudirman No. 123, Jakarta",
  "notes": "Mobil sangat kotor"
}
```

### Create Transaction
```bash
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "amount": 50000,
  "method": "ewallet"
}
```

## Error Handling

API menggunakan format error response yang konsisten:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "details": "Additional error details (development only)"
}
```

## Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run seed     # Seed database
```

### Database Commands
```bash
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev      # Create and apply migration
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema to database
```

## Testing

Untuk testing API, gunakan:
- **Postman** atau **Insomnia** untuk testing manual
- **Thunder Client** (VS Code extension)

Default admin credentials:
- Email: `admin@carwash.com`
- Password: `admin123`

Default test user:
- Email: `user@test.com`
- Password: `user123`

## Production Deployment

1. Set environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Ensure database is accessible
5. Run migrations: `npx prisma migrate deploy`

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the ISC License.
