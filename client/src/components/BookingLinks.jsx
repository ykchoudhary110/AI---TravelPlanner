// client/src/components/BookingLinks.jsx
import React from "react";
import { HStack, Link, Box, Text, Icon, Tooltip } from "@chakra-ui/react";
import { FaPlane, FaHotel } from "react-icons/fa";

export default function BookingLinks({ size = "md" }) {
  const links = [
    {
      key: "hotels",
      href: "https://www.booking.com",
      label: "Hotels (Booking.com)",
      icon: FaHotel,
    },
    {
      key: "flights",
      href: "https://www.skyscanner.net",
      label: "Flights (Skyscanner)",
      icon: FaPlane,
    },
  ];

  return (
    <HStack spacing={3} align="center">
      {links.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          isExternal
          aria-label={l.label}
          _hover={{ textDecoration: "none", transform: "translateY(-2px)" }}
        >
          <Box
            display="flex"
            alignItems="center"
            bg="white"
            px={3}
            py={2}
            borderRadius="md"
            boxShadow="sm"
            transition="all 120ms ease"
          >
            <Tooltip label={l.label} placement="top" openDelay={300}>
              <Icon as={l.icon} w={size === "sm" ? 4 : 5} h={size === "sm" ? 4 : 5} color="teal.500" />
            </Tooltip>
            <Text ml={3} fontSize={size === "sm" ? "sm" : "md"} fontWeight="medium" color="gray.700">
              {l.label.split(" ")[0]}
            </Text>
          </Box>
        </Link>
      ))}
    </HStack>
  );
}
