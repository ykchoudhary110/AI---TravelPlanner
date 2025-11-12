// client/src/components/TripCard.jsx
import React, { useState } from "react";
import {
  Box,
  Badge,
  Heading,
  Text,
  Stack,
  Button,
  useToast,
  Flex,
  Spacer,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  HStack,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, RepeatIcon } from "@chakra-ui/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import API from "../api";

export default function TripCard({ trip, onUpdated }) {
  const { _id, destination, startDate, endDate, aiPlan, fallbackReason, budget, preferences } = trip;
  const start = startDate ? new Date(startDate).toLocaleDateString() : "";
  const end = endDate ? new Date(endDate).toLocaleDateString() : "";
  const toast = useToast();

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editDestination, setEditDestination] = useState(destination || "");
  const [editStart, setEditStart] = useState(startDate ? startDate.slice(0, 10) : "");
  const [editEnd, setEditEnd] = useState(endDate ? endDate.slice(0, 10) : "");
  const [editBudget, setEditBudget] = useState(budget || "");
  const [editPreferences, setEditPreferences] = useState(preferences || "");
  const [editAiPlan, setEditAiPlan] = useState(aiPlan || "");
  const [loading, setLoading] = useState(false);

  // Open modal and sync data
  const openEditor = () => {
    setEditDestination(destination || "");
    setEditStart(startDate ? startDate.slice(0, 10) : "");
    setEditEnd(endDate ? endDate.slice(0, 10) : "");
    setEditBudget(budget || "");
    setEditPreferences(preferences || "");
    setEditAiPlan(aiPlan || "");
    onOpen();
  };

  // Delete trip
  const handleDelete = async () => {
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    try {
      setLoading(true);
      await API.delete(`/plan/${_id}`);
      toast({ title: "Trip deleted", status: "success", duration: 3000 });
      setLoading(false);
      onUpdated?.();
    } catch (e) {
      setLoading(false);
      toast({
        title: "Delete failed",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
    }
  };

  // Save manual edits
  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        destination: editDestination,
        startDate: editStart,
        endDate: editEnd,
        budget: editBudget,
        preferences: editPreferences,
        aiPlan: editAiPlan,
        regenerate: false,
      };
      await API.put(`/plan/${_id}`, payload);
      toast({ title: "Trip updated", status: "success", duration: 3000 });
      setLoading(false);
      onClose();
      onUpdated?.();
    } catch (e) {
      setLoading(false);
      toast({
        title: "Update failed",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
    }
  };

  // Regenerate with Gemini (server will re-call the AI)
  const handleRegenerate = async () => {
    if (!window.confirm("Regenerate trip plan using Gemini AI?")) return;
    try {
      setLoading(true);
      const payload = {
        destination: editDestination,
        startDate: editStart,
        endDate: editEnd,
        budget: editBudget,
        preferences: editPreferences,
        regenerate: true,
      };
      await API.put(`/plan/${_id}`, payload);
      toast({
        title: "Plan regenerated",
        description: "AI plan successfully updated.",
        status: "success",
        duration: 3000,
      });
      setLoading(false);
      onClose();
      onUpdated?.();
    } catch (e) {
      setLoading(false);
      toast({
        title: "Regenerate failed",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="md" p={5} bg="white" boxShadow="md">
      <Stack spacing={3}>
        {/* Header */}
        <Flex align="center">
          <Box>
            <Heading size="md">{destination}</Heading>
            <Text color="gray.600" fontSize="sm">
              {start && end ? `Dates: ${start} – ${end}` : "No dates set"}
            </Text>
          </Box>
          <Spacer />
          <HStack spacing={2}>
            <IconButton
              aria-label="Edit"
              icon={<EditIcon />}
              size="sm"
              colorScheme="teal"
              onClick={openEditor}
            />
            <IconButton
              aria-label="Regenerate"
              icon={<RepeatIcon />}
              size="sm"
              colorScheme="purple"
              onClick={openEditor}
            />
            <IconButton
              aria-label="Delete"
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={handleDelete}
            />
          </HStack>
        </Flex>

        {/* Badge */}
        {fallbackReason && (
          <Badge colorScheme="orange" w="fit-content">
            Fallback: {fallbackReason}
          </Badge>
        )}

        {/* AI Plan Markdown */}
        <Box whiteSpace="pre-wrap" maxH="400px" overflowY="auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {aiPlan || "No AI plan yet."}
          </ReactMarkdown>
        </Box>
      </Stack>

      {/* Edit / Regenerate Modal */}
      <Modal isOpen={isOpen} onClose={() => !loading && onClose()}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Trip</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Destination</FormLabel>
              <Input value={editDestination} onChange={(e) => setEditDestination(e.target.value)} />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>End Date</FormLabel>
              <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Budget (USD)</FormLabel>
              <Input value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Preferences</FormLabel>
              <Input
                value={editPreferences}
                onChange={(e) => setEditPreferences(e.target.value)}
              />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Plan Details (Editable)</FormLabel>
              <Textarea
                value={editAiPlan}
                onChange={(e) => setEditAiPlan(e.target.value)}
                rows={8}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                You can manually edit this AI plan or click “Regenerate (AI)” to recreate it using
                Gemini.
              </Text>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button colorScheme="teal" mr={3} isLoading={loading} onClick={handleSave}>
              Save
            </Button>
            <Button colorScheme="purple" isLoading={loading} onClick={handleRegenerate}>
              Regenerate (AI)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
