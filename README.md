## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB connection string

### To run the project, follow these steps:

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd OnlineCoursesPlatform
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   ```
   - Create a `.env` file in the server folder and add your **MongoDB** connection string:
     ```
     MONGODB_URI=<your-mongodb-connection-string>
     ```
   - Run the server:
     ```bash
     npm start        # or
     npm run dev      # for development with auto-reload
     ```

3. **Setup React Client**
   ```bash
   cd client
   npm install
   npm run dev       # Start development server
   ```
   - The client will typically run on `http://localhost:5173`

### Available Scripts

**Client:**
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**Server:**
- `npm start` - Start the server
- `npm run dev` - Start with auto-reload

