# eFine - Electronic Fine Payment System

A React Native application for electronic fine payment and management in Romania. The app allows users to submit fine payment information, automatically calculate discounts and penalties based on payment timing, and generate payment documents.

## 🚀 Features

- **Fine Payment Form**: Complete form for submitting fine payment information
- **Automatic Calculations**:
  - Discount calculation based on payment timing (50% within 15 days, 25% within 30 days)
  - Late payment penalties (10% after 30 days)
- **Data Management**: Save form data and XML payloads to MongoDB
- **PDF Generation**: Generate payment order PDF documents from saved data
- **Multi-platform Support**: Works on iOS, Android, and Web

## 🛠️ Tech Stack

### Frontend

- **React Native** with Expo - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Expo Router** - File-based navigation and routing
- **Tailwind CSS** (twrnc) - Utility-first styling for React Native
- **PDF Generation** - Create PDF documents from form data
- **MongoDB** - Database integration for storing form submissions

### Backend Requirements

- **Express.js Server** - API server for database operations
- **MongoDB** - Database for storing form data and XML payloads

## 📁 Project Structure

```
eFine/
├── frontend/
│   ├── api/                  # API client and database client
│   │   ├── client.ts         # Custom request API client
│   │   ├── databaseClient.ts # MongoDB CRUD operations
│   │   └── requestBuilder.ts # Request builder utility
│   ├── app/                  # Expo Router pages
│   │   ├── dashboard/        # Main dashboard/fine payment form
│   │   └── navigation/       # Navigation configuration
│   ├── components/           # Reusable React Native components
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions (PDF, XML generation)
└── README.md
```

## 🔧 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or cloud instance)
- Expo CLI (optional, but recommended)

## 📦 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd eFine
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Set up Backend Server

Ensure you have a backend Express.js server running that provides:

- MongoDB connection
- API endpoint at `/api` that handles:
  - `getDataFromCollection` - Query documents
  - `setDataToCollection` - Create/update documents
  - `deleteDataFromCollection` - Delete documents

See the `backend/` directory for the backend implementation.

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
GOOGLE_API_KEY=your_google_api_key (optional)
FIREBASE_API=your_firebase_api_key (optional)
```

**Note**: These environment variables are optional and may be used for future features. The core fine payment functionality only requires a MongoDB backend.

## 🚀 Running the Application

### Start Frontend

```bash
cd frontend
npm start
```

Or for specific platforms:

```bash
npm run android  # Android emulator/device
npm run ios      # iOS simulator
npm run web      # Web browser
```

### Backend Server

Make sure the backend Express server is running on `http://localhost:3000` (or configure the API base URL in `frontend/api/databaseClient.ts` for different environments).

For Android emulator, the backend URL is automatically set to `http://10.2.2.2:3000`.

## 📡 API Integration

The frontend communicates with the backend using two API clients:

### Database Client

Used for standard MongoDB CRUD operations:

```typescript
import {
  getDataFromCollection,
  setDataToCollection,
  deleteDataFromCollection,
} from "../api/databaseClient";

// Get data
const response = await getDataFromCollection("formInputs", { query: {} });

// Save data
const response = await setDataToCollection("formInputs", data);

// Delete data
const response = await deleteDataFromCollection("formInputs", { query: {} });
```

### Custom Request Client

Used for specialized operations (if needed):

```typescript
import { apiClient } from "../api/client";

const data = await apiClient.request<ResponseType>("entityName", {
  // params
});
```

## 💾 Data Storage

The application stores data in two MongoDB collections:

1. **formInputs** - Stores the complete form submission data including:

   - Personal information
   - Fine details
   - Calculated amounts (discounts, penalties, totals)
   - Submission timestamps

2. **xmlPayloads** - Stores XML formatted data alongside form submissions

## 📄 PDF Generation

The app can generate PDF documents from saved form data. PDF generation is only available after the form has been saved at least once.

Features:

- Generates payment order PDFs
- Uses saved form data (not current form state)
- Indicates when form has unsaved changes

## 🧪 Development

### Frontend Development

```bash
cd frontend
npm start  # Expo development server
```

### Code Structure

- **Components**: Reusable React Native components in `components/`
- **Hooks**: Custom hooks for API requests and navigation in `hooks/`
- **API Layer**: Centralized API clients in `api/`
- **Types**: TypeScript definitions in `types/`

## 📝 Scripts

### Frontend Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web browser
- `npm test` - Run tests
- `npm run lint` - Run linter

## 🔒 Security Notes

- Never commit `.env` files to version control
- Keep API keys secure
- Use environment variables for all sensitive configuration
- Implement proper authentication and authorization for production use
- Personal data (CNP, addresses) should be encrypted in transit and at rest

## 📄 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue in the repository.
