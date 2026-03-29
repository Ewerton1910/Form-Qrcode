import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomerForm from "./components/CustomerForm";
import AdminPanel from "./components/AdminPanel";
import OrdersPage from "./components/OrdersPage";
import SetupDatabase from "./components/SetupDatabase";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<CustomerForm />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
          <Route path="/setup-db" element={<SetupDatabase />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
