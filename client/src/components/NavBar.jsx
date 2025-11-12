import React from 'react';
import { Box, Flex, Button, Heading } from '@chakra-ui/react';
import { FaPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function NavBar(){
  const nav = useNavigate();
  const logout = () => { localStorage.removeItem('token'); nav('/login'); };
  return (
    <Box bg="white" boxShadow="sm" px="6" py="3">
      <Flex align="center" justify="space-between" maxW="1100px" mx="auto">
        <Flex align="center" gap="3">
          <FaPlane size={26} color="#2b6cb0" />
          <Heading size="md">AI Trip Planner</Heading>
        </Flex>
        <Flex gap="3">
          <Button variant="ghost" onClick={()=>nav('/dashboard')}>Dashboard</Button>
          <Button colorScheme="teal" onClick={()=>nav('/planner')}>New Plan</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </Flex>
      </Flex>
    </Box>
  );
}
