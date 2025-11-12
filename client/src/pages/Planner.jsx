// client/src/pages/Planner.jsx
import React, { useState } from "react";
import {
  Container, Box, FormControl, FormLabel, Input, Textarea, Button, Heading, Spinner, useToast
} from "@chakra-ui/react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Planner() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const toast = useToast();

  // helper for min date (today) in yyyy-mm-dd
  const todayIso = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");

    // validation: ensure dates are set and start <= end
    if (!destination || !startDate || !endDate) {
      setErr("Please fill destination and both dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErr("Start date must be before or equal to end date.");
      return;
    }

    setLoading(true);
    try {
      // API expects date strings — native yyyy-mm-dd is fine
      const res = await API.post("/plan/generate", {
        destination,
        startDate,
        endDate,
        budget,
        preferences,
      });
      setLoading(false);
      toast({ title: "Plan created", description: `Plan for ${destination} saved`, status: "success", duration: 4000 });
      nav("/dashboard");
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || "Server failed";
      setErr(msg);
      console.error("Planner error:", err);
    }
  };

  return (
    <Container maxW="700px" py={8}>
      <Heading mb={6}>Plan Your Trip</Heading>
      <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
        <form onSubmit={submit}>
          <FormControl mb={4}>
            <FormLabel>Destination</FormLabel>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or country" />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Start Date</FormLabel>
            {/* native date input shows calendar in browsers */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={todayIso}
              placeholder="YYYY-MM-DD"
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>End Date</FormLabel>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || todayIso} // end date cannot be before start date
              placeholder="YYYY-MM-DD"
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Budget (USD)</FormLabel>
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Example: 2000" />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Preferences</FormLabel>
            <Textarea value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g. family trip, museums, food" />
          </FormControl>

          {err && <Box color="red.500" mb={3}>{err}</Box>}

          <Button type="submit" colorScheme="teal" isDisabled={loading} w="full">
            {loading ? <Spinner size="sm" mr={3} /> : null}
            {loading ? "Generating plan — please wait" : "Generate Plan"}
          </Button>
        </form>
      </Box>
    </Container>
  );
}
