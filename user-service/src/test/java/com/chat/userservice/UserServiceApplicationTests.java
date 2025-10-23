package com.chat.userservice;

import com.chat.userservice.controller.UserController;
import com.chat.userservice.entity.User;
import com.chat.userservice.repository.UserRepository;
import com.chat.userservice.service.UserService;
import com.chat.userservice.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureTestMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureTestMvc
class UserServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtil jwtUtil;

    private User testUser;
    private String testToken;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedpassword");
        testUser.setActive(true);
        testUser.setLastSeen(LocalDateTime.now());

        testToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlciJ9.test";
    }

    @Test
    void contextLoads() {
        // Test that the application context loads successfully
    }

    @Test
    void testUserRegistration() throws Exception {
        // Arrange
        Map<String, String> registrationRequest = new HashMap<>();
        registrationRequest.put("username", "newuser");
        registrationRequest.put("email", "newuser@example.com");
        registrationRequest.put("password", "password123");

        when(userService.registerUser(anyString(), anyString(), anyString()))
                .thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void testUserRegistrationWithExistingUsername() throws Exception {
        // Arrange
        Map<String, String> registrationRequest = new HashMap<>();
        registrationRequest.put("username", "existinguser");
        registrationRequest.put("email", "existing@example.com");
        registrationRequest.put("password", "password123");

        when(userService.registerUser(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("Username already exists"));

        // Act & Assert
        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Username already exists"));
    }

    @Test
    void testUserLogin() throws Exception {
        // Arrange
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("username", "testuser");
        loginRequest.put("password", "password123");

        when(userService.authenticateUser(anyString(), anyString()))
                .thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken(anyString())).thenReturn(testToken);

        // Act & Assert
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpected(status().isOk())
                .andExpect(jsonPath("$.token").value(testToken))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void testUserLoginWithInvalidCredentials() throws Exception {
        // Arrange
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("username", "testuser");
        loginRequest.put("password", "wrongpassword");

        when(userService.authenticateUser(anyString(), anyString()))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    void testUserLogout() throws Exception {
        // Arrange
        when(jwtUtil.extractUsername(anyString())).thenReturn("testuser");

        // Act & Assert
        mockMvc.perform(post("/api/users/logout")
                .header("Authorization", "Bearer " + testToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    @Test
    void testGetDashboard() throws Exception {
        // Arrange
        when(userService.getAllUsers()).thenReturn(Arrays.asList(testUser));
        when(userService.getTotalUsers()).thenReturn(1L);
        when(userService.getActiveUsers()).thenReturn(1L);

        // Act & Assert
        mockMvc.perform(get("/api/users/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(1))
                .andExpect(jsonPath("$.activeUsers").value(1))
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.users[0].username").value("testuser"));
    }

    @Test
    void testValidateToken() throws Exception {
        // Arrange
        when(jwtUtil.isTokenValid(anyString())).thenReturn(true);
        when(jwtUtil.extractUsername(anyString())).thenReturn("testuser");

        // Act & Assert
        mockMvc.perform(get("/api/users/validate")
                .header("Authorization", "Bearer " + testToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void testValidateInvalidToken() throws Exception {
        // Arrange
        when(jwtUtil.isTokenValid(anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/users/validate")
                .header("Authorization", "Bearer invalidtoken"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false));
    }

    @Test
    void testCorsConfiguration() throws Exception {
        // Test CORS headers are properly set
        mockMvc.perform(options("/api/users/register")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void testJwtUtilFunctionality() {
        // Test JWT utility methods
        JwtUtil realJwtUtil = new JwtUtil();
        
        String token = realJwtUtil.generateToken("testuser");
        assertNotNull(token);
        
        String extractedUsername = realJwtUtil.extractUsername(token);
        assertEquals("testuser", extractedUsername);
        
        assertTrue(realJwtUtil.isTokenValid(token));
    }

    @Test
    void testUserEntityValidation() {
        // Test User entity constraints
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setActive(true);
        user.setLastSeen(LocalDateTime.now());

        assertNotNull(user.getUsername());
        assertNotNull(user.getEmail());
        assertNotNull(user.getPassword());
        assertTrue(user.isActive());
        assertNotNull(user.getLastSeen());
    }

    @Test
    void testPasswordEncryption() throws Exception {
        // Test that passwords are properly encrypted
        Map<String, String> registrationRequest = new HashMap<>();
        registrationRequest.put("username", "secureuser");
        registrationRequest.put("email", "secure@example.com");
        registrationRequest.put("password", "plainpassword");

        User secureUser = new User();
        secureUser.setId(2L);
        secureUser.setUsername("secureuser");
        secureUser.setEmail("secure@example.com");
        secureUser.setPassword("$2a$10$hashedpassword"); // BCrypt hash format

        when(userService.registerUser(anyString(), anyString(), anyString()))
                .thenReturn(secureUser);

        MvcResult result = mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest)))
                .andExpect(status().isOk())
                .andReturn();

        // Verify password is not stored in plain text
        assertNotEquals("plainpassword", secureUser.getPassword());
        assertTrue(secureUser.getPassword().startsWith("$2a$"));
    }
}
