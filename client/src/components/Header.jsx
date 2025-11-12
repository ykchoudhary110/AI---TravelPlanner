// client/src/components/Header.jsx
import React from "react";
import { Flex, Box, Button, Heading, HStack, Spacer, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import BookingLinks from "./BookingLinks";

export default function Header() {
  const nav = useNavigate();
  const toast = useToast();

  const logout = () => {
    localStorage.removeItem("token");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    nav("/login");
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      bg="teal.500"
      color="white"
      px={{ base: 4, md: 8 }}
      py={3}
      boxShadow="md"
      position="sticky"
      top="0"
      zIndex="1000"
    >
      {/* Logo / Title */}
      <Box cursor="pointer" onClick={() => nav("/dashboard")}>
        <Heading size="md" letterSpacing="wide">
          🌍 AI Trip Planner
        </Heading>
      </Box>

      <Spacer />

      {/* Right side buttons and links */}
      <HStack spacing={{ base: 2, md: 4 }}>
        {/* Booking + Flights links */}
        <BookingLinks size="sm" />

        {/* Navigation buttons */}
        <Button
          colorScheme="whiteAlpha"
          variant="ghost"
          size="sm"
          _hover={{ bg: "teal.600" }}
          onClick={() => nav("/dashboard")}
        >
          Dashboard
        </Button>

        <Button
          colorScheme="whiteAlpha"
          variant="ghost"
          size="sm"
          _hover={{ bg: "teal.600" }}
          onClick={() => nav("/planner")}
        >
          Plan Trip
        </Button>

        <Button
          colorScheme="red"
          variant="solid"
          size="sm"
          _hover={{ bg: "red.600" }}
          onClick={logout}
        >
          Logout
        </Button>
      </HStack>
    </Flex>
  );
}
