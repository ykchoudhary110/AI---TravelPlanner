// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Box, Button, SimpleGrid, Spinner, Center, Text, Container } from "@chakra-ui/react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import TripCard from "../components/TripCard";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const loadTrips = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await API.get("/plan/mytrips");
      setTrips(res.data.trips || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    // optionally poll every 30s: const id = setInterval(loadTrips, 30000); return () => clearInterval(id);
  }, []);

  return (
    <Container maxW="1200px" py={8}>
      <Box mb={6}>
        <Text fontSize="4xl" fontWeight="bold">Your Trips</Text>
        <Button mt={3} colorScheme="teal" onClick={() => nav("/planner")}>Plan a new trip</Button>
      </Box>

      {loading && (
        <Center py={20}>
          <Spinner size="xl" />
        </Center>
      )}

      {err && (
        <Center py={6}>
          <Text color="red.500">{err}</Text>
        </Center>
      )}

      {!loading && !err && trips.length === 0 && (
        <Center py={20}>
          <Text color="gray.500">You have no trips yet — create your first plan!</Text>
        </Center>
      )}

      <SimpleGrid columns={[1, 1, 2]} spacing={6}>
        {trips.map(t => (
          <TripCard key={t._id} trip={t} onUpdated={loadTrips} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
