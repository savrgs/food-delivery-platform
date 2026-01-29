# FreshEats - Food Delivery App


A modern, full-stack food delivery application built with **Angular 21** and **Node.js/Express**. Features a beautiful creamy aesthetic, real-time order tracking simulation, and complete user authentication flow.

<img width="184" height="67" alt="image" src="https://github.com/user-attachments/assets/534ebe57-4377-48da-b5b6-4095aaa254c3" />


---

## Features

### 🔐 Authentication
- User registration with email validation
- Secure login with JWT tokens
- Password reset flow (with email support or demo mode)
- Protected routes with auth guards

### 🏠 Restaurant Discovery
- Browse local restaurants with beautiful x 
- Filter by cuisine type, distance, and delivery time
- Search restaurants by name
- Distance calculation from user location
- Dynamic delivery time estimates

### 🍕 Ordering System
- View restaurant menus with dish details
- Add items to cart with quantity selection
- Multi-restaurant cart management
- Order checkout with address confirmation

### 📦 Real-Time Order Tracking
- Live status progression simulation
- Animated countdown timer
- Glowing pulse effects on current status
- Status updates: Confirmed → Preparing → On the Way → Delivered
- Persistent order status in database

### 👤 User Profile
- View and edit profile information
- Update delivery address
- Set location for distance calculations

### 🔔 Toast Notifications
- Beautiful slide-in notifications
- Success, error, warning, and info states
- Auto-dismiss with configurable duration

---

## 🛠️ Tech Stack

### Frontend
- **Angular 21** - Latest standalone components
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming for async operations
- **Pure CSS** - Custom animations (no external libraries!)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Nodemailer** - Email support (optional)

---

## 📸 Screenshots

### Login Page
Clean, minimal login form with warm beige gradient background.
<img width="534" height="663" alt="image" src="https://github.com/user-attachments/assets/c2a76201-40de-4485-a62f-e57800648b2f" />


### Register Page
New user registration with validation feedback.
<img width="747" height="904" alt="image" src="https://github.com/user-attachments/assets/c0a108a2-a542-47c9-b033-7c1415068e3b" />


### Password Reset
Secure password reset flow with demo mode fallback.
<img width="658" height="705" alt="image" src="https://github.com/user-attachments/assets/0ee181b9-a3ec-4953-829e-acbe90a8df9d" />


### Home / Restaurant List
Browse restaurants with distance badges, delivery times, and filtering options.
<img width="1894" height="945" alt="image" src="https://github.com/user-attachments/assets/c6b456d4-c352-41a0-a078-d9244ae0804e" />


### Restaurant Filters
Filter by cuisine, distance (km), and maximum delivery time.
<img width="1883" height="944" alt="image" src="https://github.com/user-attachments/assets/db438ff2-e8a9-47fd-8e7b-bdf3c0cf3118" />


### Restaurant Detail / Menu
View restaurant menu, add dishes to cart with quantity controls.
<img width="1881" height="941" alt="image" src="https://github.com/user-attachments/assets/360f8f9b-835b-4f06-9d33-5234baceb9f3" />


### Cart
Review cart items, see totals, and proceed to checkout.
<img width="641" height="483" alt="image" src="https://github.com/user-attachments/assets/81e13b42-6f81-4d36-be4d-adde9a483a5e" />


### Order Tracking
Real-time order status with animated progress bar and countdown timer.
<img width="1883" height="948" alt="image" src="https://github.com/user-attachments/assets/7961dba7-8fdb-4a48-af49-47c256ef3fb2" />

### Orders History
View past orders with status badges and quick reorder options.
<img width="757" height="853" alt="image" src="https://github.com/user-attachments/assets/19e17db3-e09b-41de-8214-c550427383d8" />

### Profile
Manage user information and delivery address.
<img width="593" height="849" alt="image" src="https://github.com/user-attachments/assets/8247f47c-71a8-4695-b33c-9d2033e1c5f4" />

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fresheats.git
   cd fresheats
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb fresheats
   
   # Run schema and seed files
   psql fresheats < db/schema.sql
   psql fresheats < db/seed.sql
   ```

3. **Configure environment variables**
   ```bash
   # In backend/.env
   PORT=3000
   JWT_SECRET=your_secret_key_here
   
   # Optional: For real email support
   EMAIL_SERVICE=hotmail
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_app_password
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

5. **Start the servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   node index.js
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. **Open the app**
   Navigate to `http://localhost:4200`

### Demo Accounts
After running seed.sql:
| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Customer |
| bob@example.com | password123 | Customer |
| owner@burgerhouse.com | password123 | Owner |

---

## 📁 Project Structure

```
food-project/
├── backend/
│   ├── index.js          # Express server & API routes
│   ├── db.js             # PostgreSQL connection
│   ├── package.json
│   └── .env              # Environment variables
│
├── db/
│   ├── schema.sql        # Database tables
│   └── seed.sql          # Sample data
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/           # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   │
│   │   │   ├── pages/          # Main app pages
│   │   │   │   ├── home/           # Restaurant list
│   │   │   │   ├── restaurant-detail/
│   │   │   │   ├── cart/
│   │   │   │   ├── orders/
│   │   │   │   ├── order-tracking/
│   │   │   │   └── profile/
│   │   │   │
│   │   │   ├── services/       # API & business logic
│   │   │   │   ├── api.ts          # Backend API calls
│   │   │   │   ├── auth.service.ts # Authentication
│   │   │   │   ├── cart.service.ts # Cart management
│   │   │   │   └── toast.service.ts
│   │   │   │
│   │   │   ├── shared/         # Reusable components
│   │   │   │   └── toast/
│   │   │   │
│   │   │   └── core/           # Guards & interceptors
│   │   │
│   │   └── styles.css
│   │
│   └── angular.json
│
└── README.md
```

---

## 🎨 Design Highlights

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Warm Brown | `#a67b5b` | Primary buttons, accents |
| Light Brown | `#d4a574` | Hover states, progress |
| Cream | `#faf8f5` | Backgrounds |
| Beige | `#f0ebe3` | Card backgrounds |
| Dark Brown | `#5a4a3a` | Text |

### CSS Animations
All animations are built with pure CSS @keyframes:

```css
/* Glowing pulse effect on current order status */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(212, 165, 116, 0.1); }
}

.progress-step.current .step-dot {
  animation: pulse 2s infinite;
}
```

### CSS-Only Icons
Status icons are created using pure CSS borders and pseudo-elements - no images or icon libraries required!

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/validate-reset-token` | Validate reset token |
| POST | `/api/auth/reset-password` | Set new password |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get current user profile |
| PATCH | `/api/me` | Update profile |

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | List all restaurants |
| GET | `/api/restaurants/:id` | Get restaurant details |
| GET | `/api/restaurants/:id/dishes` | Get restaurant menu |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/:id` | Get order details |
| POST | `/api/orders` | Create new order |
| POST | `/api/orders/:id/items` | Add item to order |
| POST | `/api/orders/:id/checkout` | Complete order |
| PATCH | `/api/orders/:id/status` | Update order status |

---

## 🔧 Key Implementation Details

### Order Tracking Simulation
The order tracking uses RxJS `interval` to simulate real-time updates:
- 1 real second = 1 simulated minute
- Status progresses proportionally: CONFIRMED (15%) → PREPARING (45%) → ON THE WAY (40%)
- Countdown timer updates every second
- Final status persists to database

### Distance Calculation
Uses Manhattan distance formula:
```typescript
distance = |userX - restaurantX| + |userY - restaurantY|
deliveryTime = 15 + distance * 3 (rounded to nearest 5 min)
```

### Authentication Flow
- JWT tokens stored in localStorage
- 7-day token expiry
- HTTP interceptor attaches tokens to requests
- Auth guard protects private routes

---

## 📝 License

This project was created for educational purposes as part of a school project.

---

## 👨‍💻 Author

**Safet Vrgovcevic**
- GitHub: [@savrgs](https://github.com/savrgs)
---

*Made for a school project - FreshEats Food Delivery App*
