import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Customer } from "@/types/customers";

export function useCustomersData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers() as any;
      const data = Array.isArray(res.data || res) ? (res.data || res) : [];
      const mappedData = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        rif: c.rif || ""
      }));
      setAllCustomers(mappedData);
      setCustomers(mappedData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  return {
    customers,
    setCustomers,
    allCustomers,
    setAllCustomers,
    loading,
    errorMsg,
    successMsg,
    loadCustomers,
    showSuccess,
    showError
  };
}