import React, { useState } from "react";
import { Box, Input, Button, Heading, Text } from "@chakra-ui/react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e?.preventDefault();
    setServerError("");
    if (!email || !password) {
      setServerError("Please enter email and password.");
      return;
    }
    try {
      setLoading(true);
      await API.post("/auth/register", { name, email, password });
      nav("/login");
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Register failed";
      setServerError(msg);
      console.error("Register err:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt="20" p="6" bg="white" borderRadius="md" boxShadow="sm">
      <Heading size="md" mb="4">Register</Heading>
      {serverError && <Text color="red.500" mb="3">{serverError}</Text>}
      <Input placeholder="Name (optional)" mb="3" value={name} onChange={e => setName(e.target.value)} />
      <Input placeholder="Email" mb="3" value={email} onChange={e => setEmail(e.target.value)} />
      <Input placeholder="Password" type="password" mb="3" value={password} onChange={e => setPassword(e.target.value)} />
      <Button onClick={submit} colorScheme="teal" w="full" isLoading={loading}>Register</Button>
      <Button variant="link" mt="3" onClick={() => nav("/login")}>Already have an account? Login</Button>
    </Box>
  );
}
