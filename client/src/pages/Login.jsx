import React, { useState } from "react";
import { Box, Input, Button, Heading, Text } from "@chakra-ui/react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e?.preventDefault();
    setServerError("");
    if (!email || !password) {
      setServerError("Please enter both email and password.");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });
      const token = res.data?.token;
      if (!token) throw new Error(res.data?.error || "No token returned");
      localStorage.setItem("token", token);
      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Login failed";
      setServerError(msg);
      console.error("Login error full:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt="20" p="6" bg="white" borderRadius="md" boxShadow="sm">
      <Heading size="md" mb="4">Login</Heading>
      {serverError && <Text color="red.500" mb="3">{serverError}</Text>}
      <Input placeholder="Email" mb="3" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input placeholder="Password" type="password" mb="3" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={submit} colorScheme="teal" w="full" isLoading={loading}>Login</Button>
      <Button variant="link" mt="3" onClick={() => nav("/register")}>Register</Button>
    </Box>
  );
}
